import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { getStore } from '../store/index.js';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  res.json(await getStore().getProducts());
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const input = req.body;
    const product = await getStore().createProduct({
      productCode: input.productCode.trim(),
      name: input.name.trim(),
      purchasedPrice: input.purchasedPrice ?? 0,
      soldPrice: input.soldPrice ?? 0,
      category: input.category.trim(),
      quantity: input.quantity ?? 0,
      discountType: input.discountType ?? 'amount',
      discount: input.discount ?? 0,
    });
    res.status(201).json(product);
  } catch (err: unknown) {
    const e = err as Error & { status?: number };
    res.status(e.status || 500).json({ error: e.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const input = req.body;
    const product = await getStore().updateProduct(id, {
      productCode: input.productCode.trim(),
      name: input.name.trim(),
      purchasedPrice: input.purchasedPrice ?? 0,
      soldPrice: input.soldPrice ?? 0,
      category: input.category.trim(),
      quantity: input.quantity ?? 0,
      discountType: input.discountType ?? 'amount',
      discount: input.discount ?? 0,
    });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (err: unknown) {
    const e = err as Error & { status?: number };
    res.status(e.status || 500).json({ error: e.message });
  }
});

router.delete('/bulk', requireAdmin, async (req, res) => {
  const ids: number[] = req.body.ids ?? [];
  const deleted = await getStore().deleteProducts(ids);
  res.json({ deleted });
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const ok = await getStore().deleteProduct(id);
  if (!ok) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.json({ ok: true });
});

export default router;
