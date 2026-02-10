import { Router } from 'express';
import { checkEmail, sendOtp, verifyOtp } from '../controllers/authController';

const router = Router();

router.post('/checkEmail', checkEmail);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

export default router;
