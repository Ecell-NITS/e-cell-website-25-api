import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { Role } from '@prisma/client';
import { sendOtp, verifyOtp } from '../utils/Otp'; // Import OTP utilities

// Import from controllers
import * as registerController from '../controllers/auth/register.controller';
import * as loginController from '../controllers/auth/login.controller';
import * as passwordController from '../controllers/auth/password.controller';
import * as profileController from '../controllers/auth/profile.controller';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

// --- OTP Routes ---
// User hits this FIRST to get the code
router.post('/send-otp', sendOtp);

// --- Auth Routes ---
// 1. Register: Middleware verifies OTP first. If valid, controller creates verified user.
router.post('/register', verifyOtp, registerController.register);

// 2. Login & Logout
router.post('/login', authLimiter, loginController.login);
router.post('/refresh', loginController.refresh);
router.post('/logout', loginController.logout);

// --- Password Management ---
// Forgot Password flow usually follows the same OTP pattern:
router.post('/forgot-password', passwordController.forgotPassword);
router.post('/reset-password', passwordController.resetPassword);

// --- Profiles ---
router.get('/public-profile/:id', profileController.getPublicProfile);

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
