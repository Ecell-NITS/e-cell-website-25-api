import { Prisma } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../../prisma/client';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { sendEmail } from '../utils/email';

export class AuthService {
  private googleClient: OAuth2Client;

  constructor() {
    this.googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }

  // --- HELPER: Generate 6-Digit OTP ---
  private generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // e.g. "123456"
  }

  // ==========================================================
  //  1. GOOGLE LOGIN (Auto-Verifies User)
  // ==========================================================
  
  async verifyGoogleToken(idToken: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      
      if (!payload?.email) {
        throw new AppError('Invalid Google Token: Email missing', 400);
      }
      return payload;
    } catch (error) {
      console.error('Google Verify Error:', error);
      throw new AppError('Invalid or expired Google Token', 401);
    }
  }

  async loginWithGoogle(idToken: string) {
    const payload = await this.verifyGoogleToken(idToken);

    // Use a transaction to prevent race conditions
    const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {      
      let user = await tx.user.findFirst({ where: { googleId: payload.sub } });
      // Find by Email (Fallback for linking accounts)
      if (!user) {
        user = await tx.user.findUnique({ where: { email: payload.email } });
        if (user) {
          // Link Account & Auto-Verify since Google is trusted
          user = await tx.user.update({
            where: { id: user.id },
            data: { 
              googleId: payload.sub, 
              picture: payload.picture,
              isVerified: true // Trust Google
            },
          });
        }
      }

      // Create new user if doesn't exist
      if (!user) {
        user = await tx.user.create({
          data: {
            email: payload.email!, 
            name: payload.name,
            googleId: payload.sub,
            picture: payload.picture,
            role: 'USER',
            isVerified: true // Trust Google
          },
        });
      }
      return user;
    });

    const tokens = await this.generateTokens(user.id, user.role);
    return { user, ...tokens };
  }

  // ==========================================================
  //  2. EMAIL & PASSWORD LOGIC (OTP SYSTEM)
  // ==========================================================

  // --- Register (Step 1: Create User & Send OTP) ---
  async register(data: any) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new AppError('Email already in use', 400);

    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    // Generate OTP
    const otp = this.generateOTP();

    //console.log("DEV OTP (Register):", otp); // <--- Add this


    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Create User (Unverified)
    await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: 'USER',
        isVerified: false, // <--- BLOCKS LOGIN
        otp,
        otpExpires
      },
    });

    // Send Email
    await sendEmail({
      email: data.email,
      subject: 'Verify your E-Cell Account',
      message: `Welcome to E-Cell! Your verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
    });

    return { message: 'OTP sent to email. Please verify to login.' };
  }

  // --- Verify Email (Step 2: Check OTP & Activate) ---
  async verifyEmail(email: string, otp: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    // Activate User & Clear OTP
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, otp: null, otpExpires: null }
    });

    // Auto-login after verification
    const tokens = await this.generateTokens(updatedUser.id, updatedUser.role);
    return { user: updatedUser, ...tokens };
  }

  // --- Login (Enforce Verification) ---
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      throw new AppError('Incorrect email or password', 401);
    }

    // BLOCK LOGIN IF NOT VERIFIED
    if (!user.isVerified) {
      throw new AppError('Email not verified. Please verify your account first.', 403);
    }

    const tokens = await this.generateTokens(user.id, user.role);
    return { user, ...tokens };
  }

  // --- Forgot Password (Step 1: Send OTP) ---
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // Silent success to prevent enumeration

    const otp = this.generateOTP();

   // console.log(" DEV OTP (Forgot Password):", otp); 

    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpires },
    });

    try {
      await sendEmail({
        email: user.email,
        subject: 'Reset Password Code',
        message: `Your password reset code is: ${otp}\n\nDo not share this code with anyone.`,
      });
    } catch (err) {
        // Rollback on error
        await prisma.user.update({ where: { id: user.id }, data: { otp: null, otpExpires: null }});
        throw new AppError("Could not send email", 500);
    }
  }

  // --- Reset Password (Step 2: Verify OTP & Change Pass) ---
  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpires: null,
      },
    });
  }

  // ==========================================================
  //  SHARED HELPERS (TOKENS & LOGOUT)
  // ==========================================================

  private async generateTokens(userId: string, role: string) {
    const accessToken = jwt.sign(
      { userId, role },
      env.JWT_ACCESS_SECRET as string, 
      { expiresIn: env.JWT_ACCESS_EXPIRY as any } 
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(incomingToken: string) {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: incomingToken },
      include: { user: true },
    });

    if (!tokenRecord) throw new AppError('Invalid Refresh Token', 401);
    
    if (tokenRecord.revoked) {
      await prisma.refreshToken.updateMany({
        where: { userId: tokenRecord.userId },
        data: { revoked: true },
      });
      throw new AppError('Security Warning: Token reuse detected.', 403);
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new AppError('Refresh token expired', 401);
    }

    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true, replacedByToken: 'rotated' },
    });

    return this.generateTokens(tokenRecord.userId, tokenRecord.user.role);
  }

  async logout(token: string) {
    await prisma.refreshToken.update({
      where: { token },
      data: { revoked: true },
    });
  }
}

export const authService = new AuthService();