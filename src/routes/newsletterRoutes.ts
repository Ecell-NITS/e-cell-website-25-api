import { Router } from 'express';
import {
  subscribe,
  getSubscribers,
  checkEmail,
  unsubscribe,
} from '../controllers/newsletterController';
import { verifyToken } from '../middlewares/verifyToken';
import { requireRole } from '../middlewares/requireRole';
import { publicLimiter } from '../middlewares/rateLimiter';
import { Role } from '@prisma/client';

const router = Router();

// Public
router.post('/subscribe', publicLimiter, subscribe);
router.post('/check-email', publicLimiter, checkEmail);

// Admin-only
router.get(
  '/',
  verifyToken,
  requireRole(Role.ADMIN, Role.SUPERADMIN),
  getSubscribers
);

router.post(
  '/unsubscribe',
  verifyToken,
  requireRole(Role.ADMIN, Role.SUPERADMIN),
  unsubscribe
);

export default router;
