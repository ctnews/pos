import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initStore, getStore } from './store/index.js';
import bootstrapRouter from './routes/bootstrap.js';
import productsRouter from './routes/products.js';
import salesRouter from './routes/sales.js';
import settingsRouter from './routes/settings.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import qrCodesRouter from './routes/qrCodes.js';

const PORT = parseInt(process.env.PORT || '3002', 10);

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, dbMode: getStore().mode });
});

app.use('/api/bootstrap', bootstrapRouter);
app.use('/api/products', productsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/qr-codes', qrCodesRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  await initStore();

  const server = app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT} [${getStore().mode}]`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\nPort ${PORT} is already in use. Stop the old server first:`);
      console.error(`  kill $(lsof -ti :${PORT})\n`);
    } else {
      console.error('Server error:', err.message);
    }
    process.exit(1);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err instanceof Error ? err.message : err);
  process.exit(1);
});
