import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// 🔐 Validate required env vars ONCE
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT) || 4000,
  CLIENT_URL: process.env.CLIENT_URL ?? 'http://localhost:3000',
  BACKEND_URL:
    process.env.BACKEND_URL ?? `http://localhost:${process.env.PORT || 4000}`,
  DATABASE_URL: process.env.DATABASE_URL ?? '',

  // 🔑 JWT (NON-OPTIONAL NOW)
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',

  // Google
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? '',

  // Email (Brevo)
  BREVO_API_KEY: process.env.BREVO_API_KEY ?? '',
  BREVO_EMAIL: process.env.BREVO_EMAIL ?? '',

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? '',
} as const;
