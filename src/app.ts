import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// --- CONFIG & UTILS ---
import { errorHandler } from './middlewares/errorHandler';

// --- ROUTE IMPORTS ---
import teamAuthRoutes from './routes/auth.routes'; // The Team's new Auth (Google, etc.)
import userOtpRoutes from './routes/authRoutes'; // YOUR Auth (OTP, CheckEmail)
import blogRoutes from './routes/blogRoutes'; // YOUR Blog routes

const app = express();

// --- MIDDLEWARE ---
// Use Team's security headers
app.use(helmet());

// Use permissive CORS so both localhost and frontend work
app.use(
  cors({
    origin: true, // Allows connections from anywhere (good for dev)
    credentials: true,
  })
);

// Body parsing (Team set a 10kb limit, which is good practice)
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// --- ROUTES ---

// 1. Health Checks
app.get('/version', (req, res) => {
  res.json({ version: '1.0.0' });
});
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 2. Register Routes
// Team's Routes (Prefix: /api/auth)
app.use('/api/auth', teamAuthRoutes);

// Your Routes (Prefix: / aka Root)
app.use('/', userOtpRoutes); // Keeps /checkEmail, /send-otp working
app.use('/', blogRoutes); // Keeps /getblogs, /publishBlog working

// --- ERROR HANDLING (Must be the last line) ---
app.use(errorHandler);

export default app;
