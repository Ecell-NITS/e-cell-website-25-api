import { Request, Response, NextFunction } from 'express';
import { sendEmail } from './email';
import prisma from '../../prisma/client'; // Use singleton
import { AppError } from './AppError';
import crypto from 'crypto';
import { Buffer } from 'node:buffer';
import { z } from 'zod';

// Validation schemas
const sendOtpSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers'),
});

export const sendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = sendOtpSchema.parse(req.body);

    // Check for recent OTP requests (rate limiting at function level)
    const recentOtp = await prisma.otp.findFirst({
      where: {
        email,
        createdAt: {
          gte: new Date(Date.now() - 60000), // Within last minute
        },
      },
    });

    if (recentOtp) {
      return next(
        new AppError('Please wait 1 minute before requesting another OTP', 429)
      );
    }

    // Generate cryptographically secure OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Only log in development (never log actual OTP in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] OTP for ${email}: ${otp}`);
    }

    // Delete old OTPs and create new one in a transaction
    const otpRecord = await prisma.$transaction(async tx => {
      await tx.otp.deleteMany({ where: { email } });
      return tx.otp.create({
        data: {
          email,
          otp,
        },
      });
    });

    // Send email (handle failures properly)
    try {
      await sendEmail({
        email,
        subject: 'E-Cell - Verification Code',
        message: `Your verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this, please ignore this email.`,
      });
    } catch (emailError) {
      console.error('Email send failed:', emailError);
      // Delete OTP since email failed
      await prisma.otp.delete({ where: { id: otpRecord.id } });
      return next(new AppError('Failed to send OTP. Please try again.', 500));
    }

    res.status(200).json({
      status: 'success',
      message: 'OTP sent successfully to your email',
    });
  } catch (error) {
    next(error); // Simply pass all errors to global handler
  }
};

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate and sanitize input
    const { email, otp } = verifyOtpSchema.parse(req.body);

    // Fetch most recent OTP for this email
    const otpRecord = await prisma.otp.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return next(new AppError('OTP not found or expired', 400));
    }

    // Check if OTP has expired (5 minutes)
    const otpAge = Date.now() - new Date(otpRecord.createdAt).getTime();
    if (otpAge > 5 * 60 * 1000) {
      await prisma.otp.delete({ where: { id: otpRecord.id } });
      return next(
        new AppError('OTP has expired. Please request a new one.', 400)
      );
    }

    // Constant-time comparison to prevent timing attacks
    const otpBuffer = Buffer.from(otp);
    const storedBuffer = Buffer.from(otpRecord.otp);

    if (
      otpBuffer.length !== storedBuffer.length ||
      !crypto.timingSafeEqual(otpBuffer, storedBuffer)
    ) {
      return next(new AppError('Invalid OTP', 400));
    }

    // OTP is valid - delete it (one-time use)
    await prisma.otp.delete({ where: { id: otpRecord.id } });

    // Pass to next middleware/controller
    next();
  } catch (error) {
    next(error); // Simply pass all errors to global handler
  }
};
