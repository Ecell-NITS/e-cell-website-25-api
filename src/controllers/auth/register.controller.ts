import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Buffer } from 'node:buffer';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { registerSchema } from '../../validators/auth.validator';
import prisma from '../../../prisma/client';

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000; // Changed from TWO_WEEKS

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
    const otpBuffer = Buffer.from(data.otp);
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
          position: data.position,
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
          position: true,
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
      env.JWT_SECRET as string,
      { expiresIn: env.JWT_EXPIRES_IN }
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
