import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/AuthService';
import { env } from '../config/env';       
import { AppError } from '../utils/AppError';

const loginSchema = z.object({
  idToken: z.string().min(1, "Google ID Token is required"),
});

export class AuthController {
  
  // POST /auth/google
  async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { idToken } = loginSchema.parse(req.body);
      const { user, accessToken, refreshToken } = await authService.loginWithGoogle(idToken);

      // Secure Cookie for Refresh Token
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        status: 'success',
        data: { user, accessToken },
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /auth/refresh
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.refreshToken;
      if (!token) throw new AppError('No refresh token provided', 401);

      const { accessToken, refreshToken } = await authService.refreshAccessToken(token);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({ status: 'success', data: { accessToken } });
    } catch (error) {
      res.clearCookie('refreshToken'); // Clear bad cookie
      next(error);
    }
  }

  // POST /auth/logout
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.refreshToken;
      if (token) await authService.logout(token);
      
      res.clearCookie('refreshToken');
      res.status(200).json({ status: 'success', message: 'Logged out' });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();