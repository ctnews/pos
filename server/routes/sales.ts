import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { getStore } from '../store/index.js';

const router = Router();

router.get('/', requireAdmin, async (_req, res) => {
  res.json(await getStore().getSales());
});

router.delete('/', requireAdmin, async (_req, res) => {
  await getStore().clearSales();
  res.json({ ok: true });
});

router.post('/checkout', requireAuth, async (req, res) => {
  const items = req.body.items ?? [];
  if (items.length === 0) {
    res.status(400).json({ error: 'Cart is empty' });
    return;
  }
  try {
    const result = await getStore().checkout(items);
    res.status(201).json(result);
  } catch (err: unknown) {
    const e = err as Error & { status?: number };
    res.status(e.status || 500).json({ error: e.message });
  }
});

export default router;
