import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import blogRoutes from './routes/blogRoutes';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// ROUTES 


app.get('/version', (req, res) => {
  res.json({ version: '1.0.0' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Register Modules
app.use('/', authRoutes);
app.use('/', blogRoutes);

export default app;