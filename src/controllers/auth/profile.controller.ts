import { Request, Response, NextFunction } from 'express';
import { updateProfileSchema } from '../../validators/auth.validator';
import { AppError } from '../../utils/AppError';
import prisma from '../../../prisma/client';

export const getMe = async (req: Request, res: Response) => {
  res.status(200).json({ status: 'success', data: { user: req.user } });
};

export const getPublicProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 👇 FIX: Use select to hide sensitive data
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        bio: true,
        picture: true,
        linkedin: true,
        github: true,
      },
    });
    if (!user) throw new AppError('User not found', 404);
    res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        picture: true,
        linkedin: true,
        github: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.status(200).json({ status: 'success', data: { user: updatedUser } });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await prisma.user.delete({ where: { id: req.user!.id } });
    res.status(200).json({ status: 'success', message: 'Account deleted' });
  } catch (error) {
    next(error);
  }
};

// ADMIN ONLY
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 👇 FIX: Use select to return only safe fields
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        picture: true,
        createdAt: true,
        // Passwords & OTPs are excluded
      },
    });
    res.status(200).json({ status: 'success', results: users.length, users });
  } catch (error) {
    next(error);
  }
};
