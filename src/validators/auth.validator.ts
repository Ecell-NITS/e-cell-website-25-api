import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  bio: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const verifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6)
});

export const resendOtpSchema = z.object({ 
  email: z.string().email() 
});

export const forgotPassSchema = z.object({
  email: z.string().email()
});

export const resetPassSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(6)
});

export const updatePassSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6)
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional()
});