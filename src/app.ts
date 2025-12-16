import express from 'express';
import blogRoutes from './routes/blog.routes';
import accountRoutes from './routes/account.routes';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/version', (_req, res) => res.json({ version: '1.0.0' }));

app.use('/', blogRoutes);
app.use('/', accountRoutes);

export default app;
