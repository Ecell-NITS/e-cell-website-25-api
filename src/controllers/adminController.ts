import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { Role } from '@prisma/client';

/**
 * GET ALL USERS (Admin / Superadmin)
 */
export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      status: 'success',
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error('GET USERS ERROR:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users',
    });
  }
};

/**
 * UPDATE USER ROLE (SUPERADMIN only)
 */
export const updateUserRole = async (
  req: Request,
  res: Response,
  role: Role
) => {
  const userId = req.params.userId as string;

  if (!userId) {
    return res.status(400).json({
      status: 'error',
      message: 'User ID is required',
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Prevent unnecessary update
    if (user.role === role) {
      return res.status(400).json({
        status: 'error',
        message: `User is already ${role}`,
      });
    }

    // Prevent demoting last SUPERADMIN
    if (user.role === Role.SUPERADMIN && role !== Role.SUPERADMIN) {
      const superAdminCount = await prisma.user.count({
        where: { role: Role.SUPERADMIN },
      });

      if (superAdminCount <= 1) {
        return res.status(403).json({
          status: 'error',
          message: 'Cannot demote the last SUPERADMIN',
        });
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return res.status(200).json({
      status: 'success',
      message: `User role updated to ${role}`,
    });
  } catch (error) {
    console.error('UPDATE ROLE ERROR:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update user role',
    });
  }
};
