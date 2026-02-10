import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../utils/prisma';
import crypto from 'crypto';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { loginSchema } from '../../validators/auth.validator';

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    if (
      !user ||
      !user.password ||
      !(await bcrypt.compare(password, user.password))
    ) {
      throw new AppError('Incorrect email or password', 401);
    }
    if (!user.isVerified) throw new AppError('Email not verified', 401);

    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: '15m' }
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
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    // 👇 FIX FOR ITEM #4: Sanitize the user object
    const userResponse: Record<string, unknown> = { ...user };
    userResponse.password = undefined;
    userResponse.otp = undefined;
    userResponse.otpExpires = undefined;

    // Send sanitized userResponse instead of raw user
    res
      .status(200)
      .json({ status: 'success', data: { user: userResponse, accessToken } });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const incomingToken = req.cookies.refreshToken;
    if (!incomingToken) throw new AppError('No token present', 401);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: incomingToken },
      include: { user: true },
    });
    if (
      !storedToken ||
      storedToken.revoked ||
      storedToken.expiresAt < new Date()
    ) {
      throw new AppError('Invalid token', 401);
    }

    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const accessToken = jwt.sign(
      {
        id: storedToken.user.id,
        email: storedToken.user.email,
        role: storedToken.user.role,
      },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const newRefreshToken = crypto.randomBytes(40).toString('hex');

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: storedToken.userId,
        expiresAt: new Date(Date.now() + ONE_WEEK),
      },
    });

    res.cookie('refreshToken', newRefreshToken, { httpOnly: true, path: '/' });
    res.status(200).json({ status: 'success', data: { accessToken } });
  } catch (error) {
    console.error('LOGIN ERROR:', error);

    if (error instanceof AppError) {
      return next(error);
    }

    if (error instanceof Error) {
      return next(new AppError(error.message, 400));
    }

    return next(new AppError('Internal Server Error', 500));
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken)
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    res.clearCookie('refreshToken');
    res.status(200).json({ status: 'success', message: 'Logged out' });
  } catch (error) {
    next(error);
  }
};
