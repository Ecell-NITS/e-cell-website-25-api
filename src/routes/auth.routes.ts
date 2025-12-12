import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/AuthController';

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

// --- Routes ---

// 1. Social Authentication (Google)
router.post('/google', authLimiter, (req, res, next) => authController.googleLogin(req, res, next));


// 2. Session Management
router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));
router.post('/logout', (req, res, next) => authController.logout(req, res, next));



export default router;