import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { UserRole } from '../types/userRole';

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
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const updateUserRole = async (
  req: Request,
  res: Response,
  role: UserRole
) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    res.json({ message: `User updated to ${role}` });
  } catch {
    res.status(500).json({ error: 'Failed to update role' });
  }
};
