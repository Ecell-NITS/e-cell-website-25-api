import { Router } from 'express';
import {
  createTreasureHuntApplication,
  getTreasureHuntApplications,
  checkTreasureHuntApplication,
  getSingleTreasureHuntApplication,
} from '../../controllers/events/treasureApply';
import { validate } from '../../middlewares/events/validate';
import { treasureHuntSchema } from '../../validators/events/treasureApply.validator';

const router = Router();

router.post(
  '/register',
  validate(treasureHuntSchema),
  createTreasureHuntApplication
);

router.get('/all', getTreasureHuntApplications);
router.post('/check', checkTreasureHuntApplication);
router.post('/single', getSingleTreasureHuntApplication);

export default router;
