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
    return Math.floor(100000 + Math.random() * 900000).toString(); 
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

    const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {      
      let user = await tx.user.findFirst({ where: { googleId: payload.sub } });
      
      if (!user) {
        user = await tx.user.findUnique({ where: { email: payload.email } });
        if (user) {
          user = await tx.user.update({
            where: { id: user.id },
            data: { 
              googleId: payload.sub, 
              picture: payload.picture,
              isVerified: true 
            },
          });
        }
      }

      if (!user) {
        user = await tx.user.create({
          data: {
            email: payload.email!, 
            name: payload.name,
            googleId: payload.sub,
            picture: payload.picture,
            role: 'USER',
            isVerified: true 
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

  async register(data: any) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new AppError('Email already in use', 400);

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const otp = this.generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

    await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: 'USER',
        isVerified: false,
        otp,
        otpExpires,
        // Profile Fields
        bio: data.bio,
        picture: data.picture,
        linkedin: data.linkedin,
        github: data.github,
        instagram: data.instagram,
        facebook: data.facebook
      },
    });

    await sendEmail({
      email: data.email,
      subject: 'Verify your E-Cell Account',
      message: `Your verification code is: ${otp}`,
    });

    return { message: 'OTP sent to email. Please verify to login.' };
  }

  async verifyEmail(email: string, otp: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, otp: null, otpExpires: null }
    });

    const tokens = await this.generateTokens(updatedUser.id, updatedUser.role);
    return { user: updatedUser, ...tokens };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      throw new AppError('Incorrect email or password', 401);
    }

    if (!user.isVerified) {
      throw new AppError('Email not verified. Please verify your account first.', 403);
    }

    const tokens = await this.generateTokens(user.id, user.role);
    return { user, ...tokens };
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; 

    const otp = this.generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpires },
    });

    try {
      await sendEmail({
        email: user.email,
        subject: 'Reset Password Code',
        message: `Your password reset code is: ${otp}`,
      });
    } catch (err) {
        await prisma.user.update({ where: { id: user.id }, data: { otp: null, otpExpires: null }});
        throw new AppError("Could not send email", 500);
    }
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.otp !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, otp: null, otpExpires: null },
    });
  }

  // ==========================================================
  //  3. NEW FEATURES
  // ==========================================================

  async resendOTP(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('User not found', 404);
    
    const otp = this.generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({ where: { id: user.id }, data: { otp, otpExpires } });
    await sendEmail({ email: user.email, subject: 'New Verification Code', message: `Your new code is: ${otp}` });
  }

  async updateProfile(userId: string, data: any) {
    const allowedUpdates = {
      name: data.name,
      bio: data.bio,
      picture: data.picture,
      linkedin: data.linkedin,
      github: data.github,
      instagram: data.instagram,
      facebook: data.facebook
    };

    Object.keys(allowedUpdates).forEach(key => 
      (allowedUpdates as any)[key] === undefined && delete (allowedUpdates as any)[key]
    );

    return await prisma.user.update({
      where: { id: userId },
      data: allowedUpdates,
    });
  }

  async getPublicProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, 
        name: true, 
        bio: true, 
        picture: true,
        linkedin: true, 
        github: true, 
        instagram: true, // ✅ Comma added here
        facebook: true,  // ✅ Comma added here
        role: true
      }
    });
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async updatePassword(userId: string, currentPass: string, newPass: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) throw new AppError('User not found', 404);

    const isMatch = await bcrypt.compare(currentPass, user.password);
    if (!isMatch) throw new AppError('Current password is incorrect', 401);

    const hashedPassword = await bcrypt.hash(newPass, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
  }

  async deleteAccount(userId: string, reason: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}_${Date.now()}@deleted.com`,
        name: 'Deleted User',
        isVerified: false,
        bio: `Account Deleted. Reason: ${reason}`
      }
    });
  }

  async getAllUsers() {
    return await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, picture: true }
    });
  }

  async changeRole(email: string, newRole: 'ADMIN' | 'USER' | 'SUPERADMIN') {
    return await prisma.user.update({
      where: { email },
      data: { role: newRole }
    });
  }

  // ==========================================================
  //  SHARED HELPERS
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