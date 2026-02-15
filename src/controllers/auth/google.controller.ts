import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../../utils/prisma';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';

const BACKEND_URL = `http://localhost:${env.PORT}`;

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

// ── Step 1: Redirect user to Google consent screen ─────────────────
export const googleRedirect = (_req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${BACKEND_URL}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state: crypto.randomBytes(16).toString('hex'),
  });

  res.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
};

// ── Step 2: Handle the callback from Google ────────────────────────
export const googleCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      throw new AppError('Authorization code missing', 400);
    }

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${BACKEND_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = (await tokenRes.json()) as {
      access_token?: string;
      id_token?: string;
      error?: string;
      error_description?: string;
    };

    if (tokens.error || !tokens.access_token) {
      console.error('Google token error:', tokens);
      throw new AppError(
        tokens.error_description ?? 'Failed to get Google tokens',
        400
      );
    }

    // Get user info from Google
    const userInfoRes = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    const googleUser = (await userInfoRes.json()) as {
      id: string;
      email: string;
      name?: string;
      picture?: string;
    };

    if (!googleUser.email) {
      throw new AppError('Could not retrieve email from Google', 400);
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (user) {
      // Update googleId & picture if not already set
      if (!user.googleId || !user.picture) {
        user = await prisma.user.update({
          where: { email: googleUser.email },
          data: {
            googleId: user.googleId ?? googleUser.id,
            picture: user.picture ?? googleUser.picture,
            isVerified: true,
          },
        });
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name ?? googleUser.email.split('@')[0],
          googleId: googleUser.id,
          picture: googleUser.picture,
          isVerified: true,
        },
      });
    }

    // Generate JWT
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Generate refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + ONE_WEEK),
      },
    });

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ONE_WEEK,
      path: '/',
    });

    // Sanitize user for frontend
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      picture: user.picture,
      isVerified: user.isVerified,
    };

    // Redirect to frontend callback page with token and user data
    const userData = encodeURIComponent(JSON.stringify(safeUser));
    const redirectUrl = `${env.CLIENT_URL}/auth/google/callback?token=${accessToken}&user=${userData}`;
    res.redirect(redirectUrl);
  } catch (error) {
    next(error);
  }
};
