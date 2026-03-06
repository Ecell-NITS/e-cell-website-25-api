import { Router } from 'express';
import {
  sendQuery,
  getQueries,
  getQueryById,
  markRead,
  markUnread,
  deleteQuery,
} from '../controllers/queryController';
import { verifyToken } from '../middlewares/verifyToken';
import { requireRole } from '../middlewares/requireRole';
import { publicLimiter } from '../middlewares/rateLimiter';
import { Role } from '@prisma/client';

const router = Router();

// Public
router.post('/send', publicLimiter, sendQuery);

// Admin-only
router.get(
  '/',
  verifyToken,
  requireRole(Role.ADMIN, Role.SUPERADMIN),
  getQueries
);

router.get(
  '/:id',
  verifyToken,
  requireRole(Role.ADMIN, Role.SUPERADMIN),
  getQueryById
);

router.patch(
  '/:id/read',
  verifyToken,
  requireRole(Role.ADMIN, Role.SUPERADMIN),
  markRead
);

router.patch(
  '/:id/unread',
  verifyToken,
  requireRole(Role.ADMIN, Role.SUPERADMIN),
  markUnread
);

router.delete(
  '/:id',
  verifyToken,
  requireRole(Role.ADMIN, Role.SUPERADMIN),
  deleteQuery
);

export default router;
