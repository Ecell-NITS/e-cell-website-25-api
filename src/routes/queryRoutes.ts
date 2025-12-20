import { Router } from "express";
import { sendQuery, getQueries } from "../controllers/queryController";
import { verifyToken } from "../middlewares/verifyToken";
import { requireRole } from "../middlewares/requireRole";
import { publicLimiter } from "../middlewares/rateLimiter";
import { UserRole } from "../types/userRole";

const router = Router();

router.post("/send", publicLimiter, sendQuery);

router.get(
  "/",
  verifyToken,
  requireRole([UserRole.ADMIN, UserRole.SUPERADMIN]),
  getQueries
);

export default router;