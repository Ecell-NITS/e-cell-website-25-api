import app from './app';
import { env } from './config/env';

const PORT = env.PORT;

// ── Keep-alive self-ping (prevents Render free tier from sleeping) ──
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes

function startKeepAlive() {
  if (env.NODE_ENV !== 'production') return;

  setInterval(async () => {
    try {
      const res = await fetch(`${env.BACKEND_URL}/health`);
      console.log(`[keep-alive] pinged /health — ${res.status}`);
    } catch (err) {
      console.error('[keep-alive] ping failed:', err);
    }
  }, PING_INTERVAL);

  console.log(`[keep-alive] self-ping every ${PING_INTERVAL / 60000} min`);
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  startKeepAlive();
});
