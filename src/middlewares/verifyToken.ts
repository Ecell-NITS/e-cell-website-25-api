import { Request, Response, NextFunction } from 'express';
import { User } from '@prisma/client';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';

interface TokenPayload extends JwtPayload {
  id: string;
  email: string;
  role: User['role'];
}

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1️⃣ Ensure JWT secret exists
    if (!env.JWT_SECRET) {
      console.error('JWT_SECRET is missing');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // 2️⃣ Read Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }

    // 3️⃣ Validate Bearer format
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Invalid authorization format' });
    }

    // 4️⃣ Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

    // 5️⃣ Attach user to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    // 6️⃣ Continue
    return next();
  } catch (error) {
    console.error('verifyToken error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
