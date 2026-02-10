import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const checkEmail = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    res.status(200).json({
      exists: !!user,
      message: user ? 'Email exists.' : 'Email not found.',
    });
  } catch {
    // Removed unused 'error' variable
    res.status(500).json({ error: 'Server error.' });
  }
};

export const sendOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ error: 'Email and OTP required.' });

  try {
    await prisma.user.upsert({
      where: { email },
      update: { otp, otpExpires: new Date(Date.now() + 10 * 60 * 1000) },
      create: { email, otp, otpExpires: new Date(Date.now() + 10 * 60 * 1000) },
    });
    res.status(200).json({ message: 'OTP sent successfully.' });
  } catch {
    // Removed unused 'error' variable
    res.status(500).json({ error: 'Failed to send OTP.' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ error: 'Email and OTP required.' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.otp !== otp)
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    if (user.otpExpires && new Date() > user.otpExpires)
      return res.status(400).json({ success: false, message: 'OTP expired.' });

    await prisma.user.update({
      where: { email },
      data: { otp: null, otpExpires: null },
    });
    res.status(200).json({ success: true, message: 'Verified.' });
  } catch {
    // Removed unused 'error' variable
    res.status(500).json({ error: 'Verification failed.' });
  }
};
