import { Router } from 'express';
import { getUsers, updateUserRole } from '../controllers/adminController';
import { verifyToken } from '../middlewares/verifyToken';
import { requireRole } from '../middlewares/requireRole';

import { Role } from '@prisma/client';

const router = Router();

router.get('/users', verifyToken, requireRole(Role.SUPERADMIN), getUsers);

router.put(
  '/make-admin/:userId',
  verifyToken,
  requireRole(Role.SUPERADMIN),
  (req, res) => updateUserRole(req, res, Role.ADMIN)
);

router.put(
  '/make-client/:userId',
  verifyToken,
  requireRole(Role.SUPERADMIN),
  (req, res) => updateUserRole(req, res, Role.USER)
);

export default router;
