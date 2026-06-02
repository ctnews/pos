import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { getPrintSystemStatus } from '../services/receiptPrinter.js';
import { getStore } from '../store/index.js';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const settings = await getStore().getSettings();
  res.json({ taxRate: settings.taxRate, dbMode: getStore().mode });
});

router.patch('/tax-rate', requireAdmin, async (req, res) => {
  const rate = parseFloat(req.body.taxRate);
  if (Number.isNaN(rate) || rate < 0 || rate > 100) {
    res.status(400).json({ error: 'Tax rate must be between 0 and 100' });
    return;
  }
  const taxRate = await getStore().updateTaxRate(rate);
  res.json({ taxRate });
});

router.get('/printer', requireAuth, async (_req, res) => {
  const settings = await getStore().getSettings();
  const system = await getPrintSystemStatus();
  res.json({
    silentPrint: settings.silentPrint,
    receiptPrinter: settings.receiptPrinter,
    system,
  });
});

router.patch('/printer', requireAuth, async (req, res) => {
  const silentPrint = Boolean(req.body.silentPrint);
  const receiptPrinter = String(req.body.receiptPrinter ?? '').trim();
  const updated = await getStore().updatePrinterSettings({ silentPrint, receiptPrinter });
  res.json(updated);
});

export default router;
