import { Router } from 'express';
import { getUsers, updateUserRole } from '../controllers/adminController';
import { verifyToken } from '../middlewares/verifyToken';
import { requireRole } from '../middlewares/requireRole';
import { UserRole } from '../types/userRole';

const router = Router();

router.get('/users', verifyToken, requireRole([UserRole.SUPERADMIN]), getUsers);

router.put(
  '/make-admin/:userId',
  verifyToken,
  requireRole([UserRole.SUPERADMIN]),
  (req, res) => updateUserRole(req, res, UserRole.ADMIN)
);

router.put(
  '/make-client/:userId',
  verifyToken,
  requireRole([UserRole.SUPERADMIN]),
  (req, res) => updateUserRole(req, res, UserRole.CLIENT)
);

export default router;
