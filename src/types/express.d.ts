import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: Partial<User> & { id: string; email: string; role: User['role'] };
    }
  }
}
