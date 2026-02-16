import { Router } from 'express';
import {
  createBidWiseApplication,
  getBidWiseApplications,
  checkBidWiseApplication,
  getSingleBidWiseApplication,
} from '../../controllers/events/Bid-wise';
import { validate } from '../../middlewares/events/validate';
import { bidWiseSchema } from '../../validators/events/bidwise.validator';

const router = Router();

router.post('/register', validate(bidWiseSchema), createBidWiseApplication);
router.get('/all', getBidWiseApplications);
router.post('/check', checkBidWiseApplication);
router.post('/single', getSingleBidWiseApplication);

export default router;
