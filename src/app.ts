import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth.routes';

const app = express();

// Security Headers
app.use(helmet());

// CORS (Allow frontend to talk to us)
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true, // Allow cookies
}));

// Body Parsers
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Routes
app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);

// Global Error Handler (Must be last)
app.use(errorHandler);

app.get('/version', (_req, res) => res.json({ version: '1.0.0' }));

export default app;
