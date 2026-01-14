import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { sendEmail } from '../../utils/email';
import {
  forgotPassSchema,
  resetPassSchema,
  updatePassSchema,
} from '../../validators/auth.validator';
import prisma from '../../../prisma/client';

// 1. FORGOT PASSWORD
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = forgotPassSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    // Even if user is not found, we often return 200 for security (prevent email enumeration),
    // logic below only runs if user exists.
    if (user) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      if (env.NODE_ENV === 'development') console.log(`🔥 RESET OTP: ${otp}`);

      // FIX: Use OTP Model instead of User Model
      // 1. Clear old OTPs for this email
      await prisma.otp.deleteMany({ where: { email } });

      // 2. Create new OTP entry
      await prisma.otp.create({
        data: {
          email,
          otp,
          // createdAt is handled automatically by @default(now()) in schema
        },
      });

      // 3. Send Email
      await sendEmail({
        email,
        subject: 'Reset Password',
        message: `Code: ${otp}`,
      });
    }

    res
      .status(200)
      .json({ status: 'success', message: 'If account exists, OTP sent' });
  } catch (error) {
    next(error);
  }
};

// 2. RESET PASSWORD
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, newPassword } = resetPassSchema.parse(req.body);

    // FIX: Verify against OTP Model, NOT User Model
    const otpRecord = await prisma.otp.findFirst({
      where: { email },
    });

    if (!otpRecord) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    // Check if OTP matches
    if (otpRecord.otp !== otp) {
      throw new AppError('Invalid OTP', 400);
    }

    // Check Expiration (5 minutes)
    const timeDiff = Date.now() - new Date(otpRecord.createdAt).getTime();
    if (timeDiff > 5 * 60 * 1000) {
      await prisma.otp.delete({ where: { id: otpRecord.id } }); // Cleanup expired
      throw new AppError('OTP expired', 400);
    }

    // OTP Valid -> Update User Password
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('User not found', 404);

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        // No need to clear passwordResetToken/Expires fields from User anymore
      },
    });

    // Cleanup used OTP
    await prisma.otp.delete({ where: { id: otpRecord.id } });

    res
      .status(200)
      .json({ status: 'success', message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

// 3. UPDATE PASSWORD (Keep as is)
export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { currentPassword, newPassword } = updatePassSchema.parse(req.body);
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.password) {
      throw new AppError('User not found', 404);
    }

    if (!(await bcrypt.compare(currentPassword, user.password!))) {
      throw new AppError('Incorrect current password', 401);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ status: 'success', message: 'Password updated' });
  } catch (error) {
    next(error);
  }
};
