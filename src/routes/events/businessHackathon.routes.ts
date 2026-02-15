import { Router } from 'express';
import {
  createBusinessHackathonApplication,
  getBusinessHackathonApplications,
  checkBusinessHackathonApplication,
  getSingleBusinessHackathonApplication,
} from '../../controllers/events/BusinessApply';

import { validate } from '../../middlewares/events/validate';
import { businessHackathonSchema } from '../../validators/events/businessHackathon.validator';

const router = Router();

router.post(
  '/register',
  validate(businessHackathonSchema),
  createBusinessHackathonApplication
);

router.get('/all', getBusinessHackathonApplications);
router.post('/check', checkBusinessHackathonApplication);
router.post('/single', getSingleBusinessHackathonApplication);

export default router;
