import type { NextFunction, Request, Response } from 'express';
import { getSession, type SessionUser } from '../auth/session.js';

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

function extractToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return undefined;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = getSession(extractToken(req));
  if (!user) {
    res.status(401).json({ error: 'Login required' });
    return;
  }
  req.user = user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    next();
  });
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const user = getSession(extractToken(req));
  if (user) req.user = user;
  next();
}
