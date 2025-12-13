import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/AuthController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// --- Security: Rate Limiters ---
// Prevents Brute Force Attacks on Login/Google endpoints (20 reqs / 15 mins)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many login attempts, please try again later.' }
});

// Prevents Spam Account Creation (5 accounts / 1 hour per IP)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { status: 'error', message: 'Too many accounts created from this IP, please try again later.' }
});

// 2. NEW: Strict OTP Limiter (3 reqs / 10 mins)
// Prevents email spamming on Register/Forgot/Resend endpoints
const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 3, 
    message: { status: 'error', message: 'Too many OTPs requested. Please wait 10 minutes.' }
  });
  
// --- Routes ---

// 1. Social Authentication (Google)
router.post('/google', authLimiter, (req, res, next) => authController.googleLogin(req, res, next));

// 2. Traditional Authentication (Email & Password)
router.post('/register', registerLimiter, (req, res, next) => authController.register(req, res, next));
router.post('/login', authLimiter, (req, res, next) => authController.login(req, res, next));

// 3. Session Management
router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));
router.post('/logout', (req, res, next) => authController.logout(req, res, next));

// 4. Password Recovery (Forgot & Reset)
router.post('/forgot-password', authLimiter, (req, res, next) => authController.forgotPassword(req, res, next));
router.post('/reset-password', authLimiter, (req, res, next) => authController.resetPassword(req, res, next));

// Only users with a valid Token can access this
router.get('/me', protect, (req, res, next) => authController.getMe(req, res, next));
router.post('/verify-email', authLimiter, (req, res, next) => authController.verifyEmail(req, res, next));

export default router;
