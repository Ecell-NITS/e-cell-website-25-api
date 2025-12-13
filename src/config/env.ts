import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000'),
  DATABASE_URL: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  
  // --- ADD THESE TWO LINES ---
  EMAIL_USER: z.string().email("EMAIL_USER must be a valid email"),
  EMAIL_PASS: z.string().min(1, "EMAIL_PASS is required"),
  // ---------------------------
  
  // Optional: URL for your frontend (used in password reset emails)
  CLIENT_URL: z.string().default('http://localhost:3000'), 
});

export const env = envSchema.parse(process.env);