import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export const checkEmail = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    return res.status(200).json({
      exists: !!user,
      message: user ? 'Email exists.' : 'Email not found.',
    });
  } catch {
    return res.status(500).json({ error: 'Server error.' });
  }
};
