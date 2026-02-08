import express from 'express';
process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';

import blogRoutes from './routes/blog.routes';
import commentRoutes from './routes/comment.routes';

import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth.routes';

import adovationRoutes from './routes/events/adovation.routes';
import bidwiseRoutes from './/routes/events/bidwise.routes';
import startupExpoRoutes from './/routes/events/startupExpo.routes';
import businessHackathonRoutes from './/routes/events/businessHackathon.routes';
import treasureApplyRoutes from './/routes/events/treasureApply.routes';

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

// Body Parsers
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Routes
app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);

// Global Error Handler (Must be last)
app.use(errorHandler);

app.get('/version', (_req, res) => res.json({ version: '1.0.0' }));

app.use('/', blogRoutes);

app.use('/', commentRoutes);

app.use('/api/events/adovation', adovationRoutes);
app.use('/api/events/bidwise', bidwiseRoutes);
app.use('/api/events/startupexpo', startupExpoRoutes);
app.use('/api/events/businesshackathon', businessHackathonRoutes);
app.use('/api/events/treasurehunt', treasureApplyRoutes);

export default app;
