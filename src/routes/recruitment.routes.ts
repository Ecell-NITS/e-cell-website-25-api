import { Router } from 'express';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { optionalAuth } from '../middlewares/optionalAuth';
import { validate } from '../middlewares/events/validate';
import {
  techDraftSchema,
  techSubmitSchema,
  otherTeamsSchema,
} from '../validators/recruitment.validator';
import {
  getMyApplications,
  saveTechDraft,
  submitTechApplication,
  submitOtherApplication,
  getAllApplications,
  getApplicationById,
} from '../controllers/recruitment.controller';

const router = Router();

// User routes — no auth required
router.get('/my-applications', getMyApplications);
router.post(
  '/apply/tech/save-draft',
  optionalAuth,
  validate(techDraftSchema),
  saveTechDraft
);
router.post(
  '/apply/tech/submit',
  optionalAuth,
  validate(techSubmitSchema),
  submitTechApplication
);
router.post(
  '/apply/other/submit',
  optionalAuth,
  validate(otherTeamsSchema),
  submitOtherApplication
);

// Admin routes — require auth + role
router.get(
  '/admin/applications',
  protect,
  restrictTo('ADMIN', 'SUPERADMIN'),
  getAllApplications
);
router.get(
  '/admin/applications/:id',
  protect,
  restrictTo('ADMIN', 'SUPERADMIN'),
  getApplicationById
);

export default router;
