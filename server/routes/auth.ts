import { Router } from 'express';
import { createSession, deleteSession } from '../auth/session.js';
import { requireAuth } from '../middleware/auth.js';
import { getStore } from '../store/index.js';

const router = Router();

router.post('/login', async (req, res) => {
  const username = String(req.body.username ?? '').trim();
  const password = String(req.body.password ?? '');
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }
  const user = await getStore().authenticateUser(username, password);
  if (!user) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }
  const token = createSession(user);
  res.json({ token, user });
});

router.post('/logout', (req, res) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    deleteSession(header.slice(7));
  }
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
