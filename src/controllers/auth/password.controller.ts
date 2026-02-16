import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';

import { AppError } from '../../utils/AppError';
import { sendEmail } from '../../utils/email';
import {
  forgotPassSchema,
  resetPassSchema,
  updatePassSchema,
} from '../../validators/auth.validator';
import {
  generateOtp,
  deletePreviousOtps,
  createOtp,
  buildOtpEmailHtml,
  isOtpExpired,
} from '../../utils/Otp';

import prisma from '../../utils/prisma';

// 1. FORGOT PASSWORD
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = forgotPassSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    // Security: do NOT reveal if user exists
    if (!user) {
      return res.status(200).json({
        status: 'success',
        message: 'If account exists, OTP has been sent',
      });
    }
    // Even if user is not found, we often return 200 for security (prevent email enumeration),
    // logic below only runs if user exists.

    const otp = generateOtp();

    await deletePreviousOtps(email);
    await createOtp(email, otp);

    const html = buildOtpEmailHtml(otp);
    // 3. Send Email
    await sendEmail({
      email,
      subject: 'Reset your password',
      message: `Your OTP is ${otp}`,
      html,
    });

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
    if (isOtpExpired(otpRecord.createdAt)) {
      await prisma.otp.delete({ where: { id: otpRecord.id } });
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
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { currentPassword, newPassword } = updatePassSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user || !user.password) {
      throw new AppError('User not found', 404);
    }

    if (!(await bcrypt.compare(currentPassword, user.password!))) {
      throw new AppError('Incorrect current password', 401);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    res.status(200).json({ status: 'success', message: 'Password updated' });
  } catch (error) {
    next(error);
  }
};
