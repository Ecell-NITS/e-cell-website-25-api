import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .trim(),
  bio: z
    .string()
    .max(1000, 'Bio must be less than 1000 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  position: z
    .string()
    .max(100, 'Position must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  linkedin: z
    .string()
    .url('Invalid LinkedIn URL')
    .regex(/linkedin\.com/, 'Must be a valid LinkedIn URL')
    .optional()
    .or(z.literal('')),
  github: z
    .string()
    .url('Invalid GitHub URL')
    .regex(/github\.com/, 'Must be a valid GitHub URL')
    .optional()
    .or(z.literal('')),
  instagram: z
    .string()
    .url('Invalid Instagram URL')
    .regex(/instagram\.com/, 'Must be a valid Instagram URL')
    .optional()
    .or(z.literal('')),
  facebook: z
    .string()
    .url('Invalid Facebook URL')
    .regex(/facebook\.com/, 'Must be a valid Facebook URL')
    .optional()
    .or(z.literal('')),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8),
});

export const verifySchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  otp: z
    .string()
    .length(6)
    .regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const resendOtpSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

export const forgotPassSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

export const resetPassSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  otp: z
    .string()
    .length(6)
    .regex(/^\d{6}$/),
  newPassword: z.string().min(8),
});

export const updatePassSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(200).trim().optional(),
  bio: z.string().max(1000).trim().optional(),
  picture: z.string().url('Invalid picture URL').optional(),
  position: z.string().max(100).trim().optional(),
  linkedin: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  facebook: z.string().url().optional().or(z.literal('')),
});
