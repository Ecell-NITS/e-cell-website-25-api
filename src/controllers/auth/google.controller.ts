import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import prisma from '../../../prisma/client';

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000; // Changed from TWO_WEEKS

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

// Validation schema for Google auth
const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential token is required'),
});

/**
 * Google Sign-In Handler
 * Handles both registration and login for Google users
 */
export const googleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Validate input
    const { credential } = googleAuthSchema.parse(req.body);

    // 2. Verify Google token
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: env.GOOGLE_CLIENT_ID,
      });
    } catch {
      throw new AppError('Invalid Google token', 401);
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      throw new AppError('Invalid Google token payload', 401);
    }

    const { email, sub: googleId, name, picture } = payload;

    // 3. Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        bio: true,
        position: true,
        picture: true,
        linkedin: true,
        github: true,
        instagram: true,
        facebook: true,
        googleId: true,
        password: true, // Check if they used password auth
        createdAt: true,
      },
    });

    // 4. Handle existing user
    if (user) {
      // Security: Prevent Google sign-in if user registered with email/password
      if (user.password && !user.googleId) {
        throw new AppError(
          'This email is registered with password. Please login with email and password.',
          403
        );
      }

      // Update Google ID if missing (shouldn't happen, but defensive)
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, picture },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            bio: true,
            position: true,
            picture: true,
            linkedin: true,
            github: true,
            instagram: true,
            facebook: true,
            googleId: true,
            createdAt: true,
          },
        });
      }
    } else {
      // 5. Create new user (Registration via Google)
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          name: name || email.split('@')[0],
          picture,
          // No password set for Google users
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          bio: true,
          position: true,
          picture: true,
          linkedin: true,
          github: true,
          instagram: true,
          facebook: true,
          googleId: true,
          createdAt: true,
        },
      });
    }

    // 6. Generate tokens
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      env.JWT_SECRET as string,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + THIRTY_DAYS), // Changed
      },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: THIRTY_DAYS, // Changed
    });

    // Remove sensitive fields from response
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      bio: user.bio,
      position: user.position,
      picture: user.picture,
      linkedin: user.linkedin,
      github: user.github,
      instagram: user.instagram,
      facebook: user.facebook,
      createdAt: user.createdAt,
    };

    res.status(200).json({
      status: 'success',
      data: {
        user: userResponse,
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};
