import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getPrintSystemStatus,
  getPrinterConfig,
  isSilentPrintEnabled,
  listAvailablePrinters,
  printReceiptSilent,
  printTestPage,
  type ReceiptPayload,
} from '../services/receiptPrinter.js';

const router = Router();

router.get('/status', requireAuth, async (_req, res) => {
  const [config, system] = await Promise.all([getPrinterConfig(), getPrintSystemStatus()]);
  res.json({
    enabled: await isSilentPrintEnabled(),
    silentPrint: config.silentPrint,
    printer: config.receiptPrinter || '(system default)',
    system,
  });
});

router.get('/printers', requireAuth, async (_req, res) => {
  const printers = await listAvailablePrinters();
  const system = await getPrintSystemStatus();
  res.json({ printers, system });
});

router.post('/receipt', requireAuth, async (req, res) => {
  if (!(await isSilentPrintEnabled())) {
    res.status(503).json({
      error: 'Silent print is disabled. Enable it in Admin → Printer settings.',
    });
    return;
  }

  try {
    const body = req.body as ReceiptPayload;
    if (!body?.items?.length) {
      res.status(400).json({ error: 'Receipt items are required' });
      return;
    }
    await printReceiptSilent(body);
    res.json({ ok: true });
  } catch (err) {
    console.error('Print failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to print receipt',
    });
  }
});

router.post('/test', requireAuth, async (_req, res) => {
  try {
    await printTestPage();
    res.json({ ok: true });
  } catch (err) {
    console.error('Test print failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Test print failed',
    });
  }
});

export default router;
