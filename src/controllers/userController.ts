import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getDashboard = async (req: Request, res: Response) => {
  try {
    // Auth check (fast fail)
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.user;

    // Fetch user dashboard data
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        name: true,
        email: true,
        bio: true,
        userimg: true,
        facebook: true,
        github: true,
        linkedin: true,
        instagram: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('DASHBOARD ERROR:', error);

    res.status(500).json({
      error: 'Failed to fetch dashboard',
      details: error instanceof Error ? error.message : error,
    });
  }
};
