import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

export const getDashboard = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
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

    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
};
