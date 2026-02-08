import { Router } from 'express';
import {
  createStartupExpoApplication,
  getStartupExpoApplications,
  checkStartupExpoApplication,
  getSingleStartupExpoApplication,
} from '../../controllers/events/StartupExpo';
import { validate } from '../../middlewares/events/validate';
import { startupExpoSchema } from '../../validators/events/startupExpo.validator';

const router = Router();

router.post(
  '/register',
  validate(startupExpoSchema),
  createStartupExpoApplication
);

router.get('/all', getStartupExpoApplications);
router.post('/check', checkStartupExpoApplication);
router.post('/single', getSingleStartupExpoApplication);

export default router;
