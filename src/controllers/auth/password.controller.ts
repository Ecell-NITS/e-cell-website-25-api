import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { sendEmail } from '../../utils/email';
import { forgotPassSchema, resetPassSchema, updatePassSchema } from '../../validators/auth.validator';

const prisma = new PrismaClient();

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = forgotPassSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      if (env.NODE_ENV === 'development') console.log(`🔥 RESET OTP: ${otp}`);

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: otp, passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000) }
      });
      await sendEmail({ email, subject: 'Reset Password', message: `Code: ${otp}` });
    }
    res.status(200).json({ status: 'success', message: 'If account exists, OTP sent' });
  } catch (error) { next(error); }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, newPassword } = resetPassSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.passwordResetToken !== otp || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, passwordResetToken: null, passwordResetExpires: null }
    });

    res.status(200).json({ status: 'success', message: 'Password reset successful' });
  } catch (error) { next(error); }
};

export const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = updatePassSchema.parse(req.body);
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !(await bcrypt.compare(currentPassword, user.password!))) {
      throw new AppError('Incorrect current password', 401);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });

    res.status(200).json({ status: 'success', message: 'Password updated' });
  } catch (error) { next(error); }
};