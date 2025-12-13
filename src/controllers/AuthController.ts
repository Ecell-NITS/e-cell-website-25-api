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
  // Optional profile fields allowed during registration
  bio: z.string().optional(),
  picture: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
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

// NEW SCHEMAS
const resendOtpSchema = z.object({ email: z.string().email() });

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().optional(),
  picture: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
});

const updatePassSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

// --- Controller Class ---

export class AuthController {

  private setCookies(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });
  }

  async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { idToken } = googleLoginSchema.parse(req.body);
      const { user, accessToken, refreshToken } = await authService.loginWithGoogle(idToken);
      this.setCookies(res, refreshToken);
      res.status(200).json({ status: 'success', data: { user, accessToken } });
    } catch (error) { next(error); }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data); 
      res.status(200).json({ status: 'success', message: result.message });
    } catch (error) { next(error); }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = verifySchema.parse(req.body);
      const { user, accessToken, refreshToken } = await authService.verifyEmail(email, otp);
      this.setCookies(res, refreshToken);
      res.status(200).json({ status: 'success', data: { user, accessToken } });
    } catch (error) { next(error); }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const { user, accessToken, refreshToken } = await authService.login(email, password);
      this.setCookies(res, refreshToken);
      res.status(200).json({ status: 'success', data: { user, accessToken } });
    } catch (error) { next(error); }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const incomingRefreshToken = req.cookies.refreshToken;
      if (!incomingRefreshToken) throw new AppError('No refresh token present', 401);
      const { accessToken, refreshToken: newRefreshToken } = await authService.refreshAccessToken(incomingRefreshToken);
      this.setCookies(res, newRefreshToken);
      res.status(200).json({ status: 'success', data: { accessToken } });
    } catch (error) {
      res.clearCookie('refreshToken');
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.cookies;
      if (refreshToken) await authService.logout(refreshToken);
      res.clearCookie('refreshToken');
      res.status(200).json({ status: 'success', message: 'Logged out successfully' });
    } catch (error) { next(error); }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = forgotPassSchema.parse(req.body);
      await authService.forgotPassword(email);
      res.status(200).json({ status: 'success', message: 'If that email exists, an OTP has been sent.' });
    } catch (error) { next(error); }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp, newPassword } = resetPassSchema.parse(req.body);
      await authService.resetPassword(email, otp, newPassword);
      res.status(200).json({ status: 'success', message: 'Password successfully reset' });
    } catch (error) { next(error); }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user) throw new AppError('Not authenticated', 401);
      res.status(200).json({ status: 'success', data: { user } });
    } catch (error) { next(error); }
  }

  // --- NEW CONTROLLER METHODS ---

  async resendOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = resendOtpSchema.parse(req.body);
      await authService.resendOTP(email);
      res.status(200).json({ status: 'success', message: 'New OTP sent to email.' });
    } catch (error) { next(error); }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateProfileSchema.parse(req.body);
      // Access user id from the middleware attached user object
      const userId = (req as any).user.id; 
      const updatedUser = await authService.updateProfile(userId, data);
      res.status(200).json({ status: 'success', message: 'Profile updated', data: { user: updatedUser } });
    } catch (error) { next(error); }
  }

  async getPublicProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await authService.getPublicProfile(id);
      // Map 'picture' to 'userimg' if needed, or send as is.
      res.status(200).json({ status: 'success', data: { ...user, userimg: user.picture } });
    } catch (error) { next(error); }
  }

  async updatePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = updatePassSchema.parse(req.body);
      const userId = (req as any).user.id;
      await authService.updatePassword(userId, currentPassword, newPassword);
      res.status(200).json({ status: 'success', message: 'Password updated successfully.' });
    } catch (error) { next(error); }
  }

  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { reason } = req.body;
      await authService.deleteAccount(userId, reason);
      res.status(200).json({ status: 'success', message: 'Account deleted successfully' });
    } catch (error) { next(error); }
  }

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await authService.getAllUsers();
      res.status(200).json({ status: 'success', results: users.length, users });
    } catch (error) { next(error); }
  }

  async changeRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, role } = req.body; 
      await authService.changeRole(email, role);
      res.status(200).json({ status: 'success', message: `User ${email} is now ${role}` });
    } catch (error) { next(error); }
  }
}

export const authController = new AuthController();