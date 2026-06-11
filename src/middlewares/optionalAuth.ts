import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../utils/prisma';

/**
 * Optional auth middleware — populates req.user if a valid JWT is present
 * but does NOT block the request if no token or an invalid token is provided.
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      const token = req.headers.authorization.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, env.JWT_SECRET) as {
          id: string;
          role: string;
        };
        const currentUser = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        if (currentUser) {
          req.user = currentUser;
        }
      }
    }
  } catch {
    // Token invalid or expired — continue without user
  }
  next();
};
