import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth.routes';
import userRoutes from "./routes/userRoutes";
import adminRoutes from "./routes/adminRoutes";
import queryRoutes from "./routes/queryRoutes";

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
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/query", queryRoutes);
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/version', (_req, res) => res.json({ version: '1.0.0' }));
app.use(errorHandler);

export default app;