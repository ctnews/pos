import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { getStore } from '../store/index.js';

const router = Router();

router.put('/:productCode', requireAdmin, async (req, res) => {
  const { dataUrl } = req.body;
  if (!dataUrl) {
    res.status(400).json({ error: 'dataUrl is required' });
    return;
  }
  await getStore().saveQrCode(req.params.productCode, dataUrl);
  res.json({ ok: true });
});

router.get('/:productCode', requireAuth, async (req, res) => {
  const dataUrl = await getStore().getQrCode(req.params.productCode);
  res.json(dataUrl ? { productCode: req.params.productCode, dataUrl } : null);
});

export default router;
