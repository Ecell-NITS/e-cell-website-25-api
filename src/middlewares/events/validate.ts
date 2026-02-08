import { z, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate =
  (schema: z.ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: err.issues,
        });
      }
      next(err);
    }
  };
