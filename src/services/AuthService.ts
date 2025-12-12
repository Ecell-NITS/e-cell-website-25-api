import { Prisma } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../../prisma/client';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
export class AuthService {
  private googleClient: OAuth2Client;

  constructor() {
    this.googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }

  // 1. Verify the token with Google
  async verifyGoogleToken(idToken: string) {
    // --- TEMPORARY MOCK START ---
    // If the token is "test-token", return a fake user without calling Google for testing purposes
    /*
    if (idToken === 'test-token') {
      return {
        email: 'testuser@example.com',
        name: 'Test User',
        sub: 'google-123456789', // Fake Google ID
        picture: 'https://via.placeholder.com/150',
      };
    }
    */
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

  // 2. Login or Register the User
  async loginWithGoogle(idToken: string) {
    const payload = await this.verifyGoogleToken(idToken);

    // Use a transaction to prevent race conditions
    const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {      
      let user = await tx.user.findUnique({ where: { googleId: payload.sub } });

      // Find by Email (Fallback for linking accounts)
      if (!user) {
        user = await tx.user.findUnique({ where: { email: payload.email } });
        if (user) {
          // Link the Google ID to the existing email account
          user = await tx.user.update({
            where: { id: user.id },
            data: { googleId: payload.sub, picture: payload.picture },
          });
        }
      }

      // Create new user if doesn't exist
      if (!user) {
        user = await tx.user.create({
          data: {
            email: payload.email!, // We checked email exists above
            name: payload.name,
            googleId: payload.sub,
            picture: payload.picture,
            role: 'USER',
          },
        });
      }
      return user;
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.role);
    return { user, ...tokens };
  }

  // 3. Generate Access (Short) and Refresh (Long) Tokens
  private async generateTokens(userId: string, role: string) {
    const accessToken = jwt.sign(
      { userId, role },
      env.JWT_ACCESS_SECRET as string, // Ensure secret is treated as string
      { 
        // Cast this to 'any' or specific string to satisfy the library strictness
        expiresIn: env.JWT_ACCESS_EXPIRY as any 
      } 
    );

    // Generate a random refresh token (Better security than JWT for refresh)
    const refreshToken = crypto.randomBytes(40).toString('hex');
    
    // Calculate expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Save to DB
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  // 4. Refresh Token Rotation (Security Best Practice)
  async refreshAccessToken(incomingToken: string) {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: incomingToken },
      include: { user: true },
    });

    if (!tokenRecord) throw new AppError('Invalid Refresh Token', 401);
    
    // Security: Reuse Detection
    if (tokenRecord.revoked) {
      // Nuke all tokens for this user if we detect theft
      await prisma.refreshToken.updateMany({
        where: { userId: tokenRecord.userId },
        data: { revoked: true },
      });
      throw new AppError('Security Warning: Token reuse detected. Please login again.', 403);
    }

    // Check Expiry
    if (new Date() > tokenRecord.expiresAt) {
      throw new AppError('Refresh token expired', 401);
    }

    // Rotate: Revoke old token, issue new one
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true, replacedByToken: 'rotated' },
    });

    return this.generateTokens(tokenRecord.userId, tokenRecord.user.role);
  }

  // 5. Logout
  async logout(token: string) {
    await prisma.refreshToken.update({
      where: { token },
      data: { revoked: true },
    });
  }
}

export const authService = new AuthService();