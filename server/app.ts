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

export async function createApp() {
  await initStore();

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

  return app;
}
