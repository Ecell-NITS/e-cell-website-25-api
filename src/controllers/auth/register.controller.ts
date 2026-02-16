import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Buffer } from 'node:buffer';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { registerSchema } from '../../validators/auth.validator';
import prisma from '../../utils/prisma';
import { SignOptions } from 'jsonwebtoken';

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const jwtOptions: SignOptions = {
  expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
};

interface UserTokenData {
  id: string;
  role: string;
  [key: string]: unknown;
}

// Helper to create token and save it
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _createSendToken = async (
  user: UserTokenData,
  statusCode: number,
  res: Response
) => {
  const accessToken = jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
    },
    env.JWT_SECRET,
    jwtOptions
  );

  const refreshToken = crypto.randomBytes(40).toString('hex');

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + ONE_WEEK),
    },
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ONE_WEEK,
  });

  res
    .status(statusCode)
    .json({ status: 'success', data: { user, accessToken } });
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Validate input
    const data = registerSchema.parse(req.body);

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      // Check if it's a Google user
      if (existingUser.googleId && !existingUser.password) {
        throw new AppError(
          'This email is registered with Google Sign-In. Please login with Google.',
          400
        );
      }
      throw new AppError('Email already in use', 400);
    }

    // 3. Verify OTP
    const otpRecord = await prisma.otp.findFirst({
      where: { email: data.email },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    // Check expiry (5 minutes)
    const otpAge = Date.now() - new Date(otpRecord.createdAt).getTime();
    if (otpAge > 5 * 60 * 1000) {
      await prisma.otp.delete({ where: { id: otpRecord.id } });
      throw new AppError('OTP has expired. Please request a new one.', 400);
    }

    // Secure comparison
    const otpBuffer = Buffer.from(req.body.otp ?? '');
    const storedBuffer = Buffer.from(otpRecord.otp);

    // Timing safe check
    if (
      otpBuffer.length !== storedBuffer.length ||
      !crypto.timingSafeEqual(otpBuffer, storedBuffer)
    ) {
      throw new AppError('Invalid OTP', 400);
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 5. Atomic Transaction: Delete OTP, Create User, Create Refresh Token
    const result = await prisma.$transaction(async tx => {
      // Consume the OTP
      await tx.otp.deleteMany({ where: { email: data.email } });

      // Create User
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          bio: data.bio,
          isVerified: true, // Since OTP is verified
          linkedin: data.linkedin,
          github: data.github,
          instagram: data.instagram,
          facebook: data.facebook,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          bio: true,
          linkedin: true,
          github: true,
          instagram: true,
          facebook: true,
          createdAt: true,
        },
      });

      // Create Refresh Token
      const refreshToken = crypto.randomBytes(40).toString('hex');
      await tx.refreshToken.create({
        data: {
          token: refreshToken,
          userId: newUser.id,
          expiresAt: new Date(Date.now() + THIRTY_DAYS), // Changed
        },
      });

      return { newUser, refreshToken };
    });

    // 6. Generate Access Token & Send Response
    // (Performed outside transaction but failure here doesn't corrupt DB state, just requires login)
    const accessToken = jwt.sign(
      { id: result.newUser.id, role: result.newUser.role },
      env.JWT_SECRET,
      jwtOptions
    );

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: THIRTY_DAYS, // Changed
    });

    res.status(201).json({
      status: 'success',
      data: {
        user: result.newUser,
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};
