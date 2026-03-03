import express from 'express';
import blogRoutes from './routes/blog.routes';
import commentRoutes from './routes/comment.routes';

import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import queryRoutes from './routes/queryRoutes';

import adovationRoutes from './routes/events/adovation.routes';
import bidwiseRoutes from './routes/events/bidwise.routes';
import startupExpoRoutes from './routes/events/startupExpo.routes';
import businessHackathonRoutes from './routes/events/businessHackathon.routes';
import treasureApplyRoutes from './routes/events/treasureApply.routes';

const app = express();

// ── Security ──
app.use(helmet());

// ── CORS (allow both local dev & production frontend) ──
const allowedOrigins = ['http://localhost:3000', env.CLIENT_URL].filter(
  Boolean
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);

// ── Body parsing ──
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// ── Health check (used by Render & keep-alive ping) ──
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/version', (_req, res) => res.json({ version: '1.0.0' }));

// ── Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/comment', commentRoutes);

// Events
app.use('/api/events/adovation', adovationRoutes);
app.use('/api/events/bidwise', bidwiseRoutes);
app.use('/api/events/startupexpo', startupExpoRoutes);
app.use('/api/events/businesshackathon', businessHackathonRoutes);
app.use('/api/events/treasurehunt', treasureApplyRoutes);

// ── Global error handler (MUST be last) ──
app.use(errorHandler);

export default app;
