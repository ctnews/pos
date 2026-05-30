import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getStore } from '../store/index.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const store = getStore();
  const [products, settings] = await Promise.all([store.getProducts(), store.getSettings()]);
  const sales = req.user?.role === 'admin' ? await store.getSales() : [];
  res.json({ products, sales, taxRate: settings.taxRate, dbMode: store.mode });
});

export default router;
