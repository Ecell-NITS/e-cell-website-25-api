import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../utils/prisma';
import crypto from 'crypto';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { loginSchema } from '../../validators/auth.validator';

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000; // Changed from TWO_WEEKS

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    // Security: Prevent password login if user registered with Google
    if (user && user.googleId && !user.password) {
      throw new AppError(
        'This account uses Google Sign-In. Please login with Google.',
        403
      );
    }

    if (
      !user ||
      !user.password ||
      !(await bcrypt.compare(password, user.password))
    ) {
      throw new AppError('Incorrect email or password', 401);
    }

    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Delete all previous refresh tokens for this user
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    const refreshToken = crypto.randomBytes(40).toString('hex');

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + THIRTY_DAYS),
      },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: THIRTY_DAYS, // Changed
      path: '/',
    });

    // 👇 FIX FOR ITEM #4: Sanitize the user object
    const userResponse: Record<string, unknown> = { ...user };
    userResponse.password = undefined;

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

    // Delete the used token + any expired tokens for this user
    await prisma.refreshToken.deleteMany({
      where: {
        userId: storedToken.userId,
        OR: [{ id: storedToken.id }, { expiresAt: { lt: new Date() } }],
      },
    });

    const accessToken = jwt.sign(
      {
        id: storedToken.user.id,
        email: storedToken.user.email,
        role: storedToken.user.role,
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const newRefreshToken = crypto.randomBytes(40).toString('hex');

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: storedToken.userId,
        expiresAt: new Date(Date.now() + THIRTY_DAYS), // Changed
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
    if (refreshToken) {
      // Find the token to get the userId, then delete ALL tokens for that user
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });
      if (storedToken) {
        await prisma.refreshToken.deleteMany({
          where: { userId: storedToken.userId },
        });
      }
    }
    res.clearCookie('refreshToken');
    res.status(200).json({ status: 'success', message: 'Logged out' });
  } catch (error) {
    next(error);
  }
};
