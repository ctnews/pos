import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { getStore } from '../store/index.js';

const router = Router();

router.use(requireAdmin);

router.get('/', async (_req, res) => {
  res.json(await getStore().getUsers());
});

router.post('/', async (req, res) => {
  try {
    const user = await getStore().createUser({
      username: req.body.username,
      password: req.body.password,
      role: req.body.role === 'admin' ? 'admin' : 'cashier',
    });
    res.status(201).json(user);
  } catch (err: unknown) {
    const e = err as Error & { status?: number };
    res.status(e.status || 500).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const input: { username?: string; password?: string; role?: 'admin' | 'cashier' } = {};
    if (req.body.username !== undefined) input.username = req.body.username;
    if (req.body.password) input.password = req.body.password;
    if (req.body.role === 'admin' || req.body.role === 'cashier') input.role = req.body.role;
    const user = await getStore().updateUser(id, input);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err: unknown) {
    const e = err as Error & { status?: number };
    res.status(e.status || 500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (req.user?.id === id) {
    res.status(400).json({ error: 'You cannot delete your own account while logged in' });
    return;
  }
  const adminCount = (await getStore().getUsers()).filter((u) => u.role === 'admin').length;
  const target = (await getStore().getUsers()).find((u) => u.id === id);
  if (target?.role === 'admin' && adminCount <= 1) {
    res.status(400).json({ error: 'At least one admin account is required' });
    return;
  }
  const ok = await getStore().deleteUser(id);
  if (!ok) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ ok: true });
});

export default router;
