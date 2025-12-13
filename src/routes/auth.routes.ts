import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/AuthController';
import { protect, restrictTo } from '../middlewares/authMiddleware';

const router = Router();

// --- Security: Rate Limiters ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many login attempts, please try again later.' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { status: 'error', message: 'Too many accounts created from this IP, please try again later.' }
});

const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 3, 
    message: { status: 'error', message: 'Too many OTPs requested. Please wait 10 minutes.' }
  });
  
// --- Routes ---

// 1. Social Authentication (Google)
router.post('/google', authLimiter, (req, res, next) => authController.googleLogin(req, res, next));

// 2. Traditional Authentication
router.post('/register', registerLimiter, (req, res, next) => authController.register(req, res, next));
router.post('/login', authLimiter, (req, res, next) => authController.login(req, res, next));
router.post('/verify-email', authLimiter, (req, res, next) => authController.verifyEmail(req, res, next));
router.post('/resend-otp', otpLimiter, (req, res, next) => authController.resendOTP(req, res, next));

// 3. Session Management
router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));
router.post('/logout', (req, res, next) => authController.logout(req, res, next));

// 4. Password Recovery
router.post('/forgot-password', authLimiter, (req, res, next) => authController.forgotPassword(req, res, next));
router.post('/reset-password', authLimiter, (req, res, next) => authController.resetPassword(req, res, next));

// 5. Public Profile (Accessible by anyone)
router.get('/public-profile/:id', (req, res, next) => authController.getPublicProfile(req, res, next));

// 6. Protected Routes (Logged in Users)
router.use(protect); // Applies to all routes below

router.get('/me', (req, res, next) => authController.getMe(req, res, next));
router.patch('/edit-profile', (req, res, next) => authController.updateProfile(req, res, next));
router.patch('/update-password', (req, res, next) => authController.updatePassword(req, res, next));
router.delete('/delete-account', (req, res, next) => authController.deleteAccount(req, res, next));

// 7. Admin Routes (Restricted)
router.use(restrictTo('ADMIN', 'SUPERADMIN'));

router.get('/all-accounts', (req, res, next) => authController.getAllUsers(req, res, next));
router.patch('/change-role', (req, res, next) => authController.changeRole(req, res, next));

export default router;