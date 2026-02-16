import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: Record<string, unknown> | undefined = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    // Provide detailed field-level errors
    errors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;
    if (err.code === 'P2002') {
      message = 'Duplicate field value entered';
    } else if (err.code === 'P2025') {
      message = 'Record not found';
    }
  }

  // Log errors appropriately based on environment
  if (process.env.NODE_ENV === 'development') {
    console.error('💥 Error:', err);
  } else {
    // In production, only log unexpected errors
    if (!(err instanceof AppError)) {
      console.error('💥 Unexpected Error:', {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
