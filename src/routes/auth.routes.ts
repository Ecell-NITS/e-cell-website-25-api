import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { Role } from '@prisma/client';
import { sendOtp } from '../utils/Otp';

// Import from controllers
import * as registerController from '../controllers/auth/register.controller';
import * as loginController from '../controllers/auth/login.controller';
import * as passwordController from '../controllers/auth/password.controller';
import * as profileController from '../controllers/auth/profile.controller';
import * as googleController from '../controllers/auth/google.controller';

const router = Router();

// Stricter rate limiting for different endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: 'Too many requests from this IP, please try again later',
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 OTP requests per 15 min (reduced from 20)
  message: 'Too many OTP requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 registration attempts per hour (reduced from 10)
  message: 'Too many registration attempts, please try again later',
});

// --- OTP Routes ---
// User hits this FIRST to get the code
router.post('/send-otp', otpLimiter, sendOtp);

// --- Auth Routes ---
// 1. Register: Controller verifies OTP internally for atomicity.
router.post('/register', registerLimiter, registerController.register);

// 2. Login & Logout
router.post('/login', authLimiter, loginController.login);
router.post('/refresh', loginController.refresh);
router.post('/logout', loginController.logout);

// --- Password Management ---
// Forgot Password flow usually follows the same OTP pattern:
router.post('/forgot-password', authLimiter, passwordController.forgotPassword);
router.post('/reset-password', authLimiter, passwordController.resetPassword);

// --- Profiles ---
router.get('/public-profile/:id', profileController.getPublicProfile);

// --- Google OAuth ---
router.post('/google', authLimiter, googleController.googleAuth);

// --- Protected Routes (Requires Login) ---
router.use(protect);
router.get('/me', profileController.getMe);
router.patch('/edit-profile', profileController.updateProfile);
router.patch('/update-password', passwordController.updatePassword);
router.delete('/delete-account', profileController.deleteAccount);

// --- Admin Only ---
router.get(
  '/all-accounts',
  restrictTo(Role.ADMIN, Role.SUPERADMIN),
  profileController.getAllUsers
);

export default router;
