import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/AuthService';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

// Validation Schema
const googleLoginSchema = z.object({
  idToken: z.string().min(1, "Google ID Token is required"),
});

export class AuthController {
  
  /**
   * POST /api/auth/google
   * Handles the Google Login flow.
   */
  async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Validate Input
      const { idToken } = googleLoginSchema.parse(req.body);

      // 2. Call the Service
      const { user, accessToken, refreshToken } = await authService.loginWithGoogle(idToken);

      // 3. Set Refresh Token as an HttpOnly Cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });

      // 4. Send the Access Token in the body
      res.status(200).json({
        status: 'success',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            role: user.role,
          },
          accessToken,
        },
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   * Called when the Access Token expires.
   */
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const incomingRefreshToken = req.cookies.refreshToken;

      if (!incomingRefreshToken) {
        throw new AppError('No refresh token present', 401);
      }

      // Rotate tokens
      const { accessToken, refreshToken: newRefreshToken } = await authService.refreshAccessToken(incomingRefreshToken);

      // Set new cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });

      res.status(200).json({
        status: 'success',
        data: { accessToken },
      });

    } catch (error) {
      res.clearCookie('refreshToken');
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.cookies;
      
      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      res.clearCookie('refreshToken');
      
      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();