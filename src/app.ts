import express from 'express';
import blogRoutes from './routes/blog.routes';
import commentRoutes from './routes/comment.routes';

import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
// --- CONFIG & UTILS ---
import { errorHandler } from './middlewares/errorHandler';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import queryRoutes from './routes/queryRoutes';

import adovationRoutes from './routes/events/adovation.routes';
import bidwiseRoutes from './/routes/events/bidwise.routes';
import startupExpoRoutes from './/routes/events/startupExpo.routes';
import businessHackathonRoutes from './/routes/events/businessHackathon.routes';
import treasureApplyRoutes from './/routes/events/treasureApply.routes';
// --- ROUTE IMPORTS ---
import teamAuthRoutes from './routes/auth.routes'; // The Team's new Auth (Google, etc.)

const app = express();
// Security Headers
app.use(helmet());

// CORS (Allow frontend to talk to us)
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true, // Allow cookies
  })
);

// Body parsing (Team set a 10kb limit, which is good practice)
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/auth', authRoutes);
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/version', (_req, res) => res.json({ version: '1.0.0' }));
app.use(errorHandler);

app.use('/api/blog', blogRoutes);

app.use('/api/comment', commentRoutes);

app.use('/api/events/adovation', adovationRoutes);
app.use('/api/events/bidwise', bidwiseRoutes);
app.use('/api/events/startupexpo', startupExpoRoutes);
app.use('/api/events/businesshackathon', businessHackathonRoutes);
app.use('/api/events/treasurehunt', treasureApplyRoutes);

// --- ROUTES ---

// 2. Register Routes
// Team's Routes (Prefix: /api/auth)
app.use('/api/auth', teamAuthRoutes);

export default app;
