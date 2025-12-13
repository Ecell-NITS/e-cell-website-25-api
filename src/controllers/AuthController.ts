import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/AuthService';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

// --- Validation Schemas ---

const googleLoginSchema = z.object({
  idToken: z.string().min(1, "Google ID Token is required"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  name: z.string().min(2, "Name is too short"),
});

const verifySchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const forgotPassSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPassSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters long"),
});

// --- Controller Class ---

export class AuthController {

  /**
   * Helper: Sets the Refresh Token HttpOnly Cookie
   */
  private setCookies(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });
  }

  /**
   * POST /api/auth/google
   * Handles Google Login flow (Auto-verified).
   */
  async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { idToken } = googleLoginSchema.parse(req.body);
      const { user, accessToken, refreshToken } = await authService.loginWithGoogle(idToken);

      this.setCookies(res, refreshToken);

      res.status(200).json({
        status: 'success',
        data: { user, accessToken },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/register
   * Step 1: User enters details -> Gets OTP (No tokens yet).
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      
      const result = await authService.register(data); 

      res.status(200).json({
        status: 'success',
        message: result.message, // "OTP sent to email..."
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/verify-email
   * Step 2: User enters OTP -> Gets Tokens (Logged in).
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = verifySchema.parse(req.body);
      const { user, accessToken, refreshToken } = await authService.verifyEmail(email, otp);

      this.setCookies(res, refreshToken);

      res.status(200).json({
        status: 'success',
        data: { user, accessToken },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Handles Email/Password Login (Must be verified).
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const { user, accessToken, refreshToken } = await authService.login(email, password);

      this.setCookies(res, refreshToken);

      res.status(200).json({
        status: 'success',
        data: { user, accessToken },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   * Rotates access tokens.
   */
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const incomingRefreshToken = req.cookies.refreshToken;
      if (!incomingRefreshToken) throw new AppError('No refresh token present', 401);

      const { accessToken, refreshToken: newRefreshToken } = await authService.refreshAccessToken(incomingRefreshToken);

      this.setCookies(res, newRefreshToken);

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
      if (refreshToken) await authService.logout(refreshToken);
      
      res.clearCookie('refreshToken');
      res.status(200).json({ status: 'success', message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Sends OTP for reset.
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = forgotPassSchema.parse(req.body);
      await authService.forgotPassword(email);

      res.status(200).json({
        status: 'success',
        message: 'If that email exists, an OTP has been sent.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/reset-password
   * Uses OTP to set new password.
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp, newPassword } = resetPassSchema.parse(req.body);
      
      await authService.resetPassword(email, otp, newPassword);

      res.status(200).json({
        status: 'success',
        message: 'Password successfully reset',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Returns current user. Protected route.
   */
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      
      if (!user) {
         throw new AppError('Not authenticated', 401);
      }

      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();