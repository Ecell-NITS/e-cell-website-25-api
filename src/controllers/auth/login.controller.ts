import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { loginSchema } from '../../validators/auth.validator';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await prisma.user.findUnique({ where: { email } });
  
      if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
        throw new AppError('Incorrect email or password', 401);
      }
      if (!user.isVerified) throw new AppError('Email not verified', 401);
  
      const accessToken = jwt.sign(
        { id: user.id, role: user.role }, 
        env.JWT_SECRET, 
        { expiresIn: env.JWT_EXPIRES_IN as any }
      );
      
      const refreshToken = crypto.randomBytes(40).toString('hex');
  
      await prisma.refreshToken.create({
        data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
      });
  
      res.cookie('refreshToken', refreshToken, { httpOnly: true, path: '/' });

      // 👇 FIX FOR ITEM #4: Sanitize the user object
      const userResponse = { ...user };
      (userResponse as any).password = undefined;
      (userResponse as any).otp = undefined;
      (userResponse as any).otpExpires = undefined;

      // Send sanitized userResponse instead of raw user
      res.status(200).json({ status: 'success', data: { user: userResponse, accessToken } });
    } catch (error) { next(error); }
  };
  
  export const refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const incomingToken = req.cookies.refreshToken;
      if (!incomingToken) throw new AppError('No token present', 401);
  
      const storedToken = await prisma.refreshToken.findUnique({ where: { token: incomingToken }, include: { user: true } });
      if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
        throw new AppError('Invalid token', 401);
      }
  
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
  
      const accessToken = jwt.sign(
        { id: storedToken.userId, role: storedToken.user.role }, 
        env.JWT_SECRET, 
        { expiresIn: env.JWT_EXPIRES_IN as any }
      );
      
      const newRefreshToken = crypto.randomBytes(40).toString('hex');
  
      await prisma.refreshToken.create({
        data: { token: newRefreshToken, userId: storedToken.userId, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
      });
  
      res.cookie('refreshToken', newRefreshToken, { httpOnly: true, path: '/' });
      res.status(200).json({ status: 'success', data: { accessToken } });
    } catch (error) { next(error); }
  };

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) await prisma.refreshToken.delete({ where: { token: refreshToken } });
    res.clearCookie('refreshToken');
    res.status(200).json({ status: 'success', message: 'Logged out' });
  } catch (error) { next(error); }
};