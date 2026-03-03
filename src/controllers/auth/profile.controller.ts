import { Request, Response, NextFunction } from 'express';
import { updateProfileSchema } from '../../validators/auth.validator';
import { AppError } from '../../utils/AppError';
import prisma from '../../utils/prisma';

/* =======================
   GET CURRENT USER
======================= */
export const getMe = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      role: true,
      userimg: true,
      picture: true,
      linkedin: true,
      github: true,
      instagram: true,
      facebook: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Return a unified 'picture' field — prefer userimg over Google picture
  const unifiedUser = {
    ...user,
    picture: user.userimg || user.picture || '',
  };

  res.status(200).json({
    status: 'success',
    data: { user: unifiedUser },
  });
};

/* =======================
   GET PUBLIC PROFILE
======================= */
export const getPublicProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      throw new AppError('Invalid user id', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        bio: true,
        picture: true,
        linkedin: true,
        github: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/* =======================
   UPDATE PROFILE
======================= */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const data = updateProfileSchema.parse(req.body);

    // Only allow ADMIN or SUPERADMIN to update role
    if (data.role) {
      const requesterRole = req.user.role;
      if (requesterRole !== 'ADMIN' && requesterRole !== 'SUPERADMIN') {
        throw new AppError('Only admins can update the position/role', 403);
      }
    }

    // If a picture URL is provided, save it to 'userimg' (user-uploaded) field
    // and clear the Google 'picture' field to avoid duplicates
    const prismaData: Record<string, unknown> = { ...data };
    if (data.picture) {
      prismaData.userimg = data.picture;
      delete prismaData.picture;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: prismaData,
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        picture: true,
        userimg: true,
        linkedin: true,
        github: true,
        instagram: true,
        facebook: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Return unified picture field
    const unifiedUser = {
      ...updatedUser,
      picture: updatedUser.userimg || updatedUser.picture || '',
    };

    res.status(200).json({
      status: 'success',
      data: { user: unifiedUser },
    });
  } catch (error) {
    next(error);
  }
};

/* =======================
   DELETE ACCOUNT
======================= */
export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    await prisma.user.delete({
      where: { id: req.user.id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/* =======================
   ADMIN: GET ALL USERS
======================= */
export const getAllUsers = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        picture: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      status: 'success',
      results: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};
