import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { registerSchema } from '../../validators/auth.validator';
import prisma from '../../../prisma/client';

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

interface UserTokenData {
  id: string;
  role: string;
  [key: string]: unknown;
}

// Helper to create token and save it
const createSendToken = async (
  user: UserTokenData,
  statusCode: number,
  res: Response
) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
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
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new AppError('Email already in use', 400);

    const hashedPassword = await bcrypt.hash(data.password, 12);

    // 👇 The comma issue was likely here
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        isVerified: true,
        bio: data.bio,
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
        isVerified: true,
        bio: true,
        linkedin: true,
        github: true,
        instagram: true,
        facebook: true,
        createdAt: true,
        // We purposefully exclude 'password', 'otp', etc.
      },
    });

    await createSendToken(newUser, 200, res);
  } catch (error) {
    next(error);
  }
};
