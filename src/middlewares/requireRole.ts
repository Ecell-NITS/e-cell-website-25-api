import { Request, Response, NextFunction } from "express";
import { UserRole } from "../types/userRole";

export const requireRole =
  (roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role as UserRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };