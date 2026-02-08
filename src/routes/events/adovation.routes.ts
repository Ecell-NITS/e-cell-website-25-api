import { Router } from 'express';
import {
  createAdovationApplication,
  getAdovationApplications,
  getSingleAdovationApplication,
  checkAdovationApplication,
} from '../../controllers/events/Adovation';
import { validate } from '../../middlewares/events/validate';
import { adovationSchema } from '../../validators/events/advocation.validator';

const router = Router();

router.post('/register', validate(adovationSchema), createAdovationApplication);

router.get('/all', getAdovationApplications);
router.post('/check', checkAdovationApplication);
router.post('/single', getSingleAdovationApplication);

export default router;
