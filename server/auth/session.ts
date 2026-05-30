import crypto from 'crypto';

export type UserRole = 'admin' | 'cashier';

export interface SessionUser {
  id: number;
  username: string;
  role: UserRole;
}

interface SessionEntry {
  user: SessionUser;
  expires: number;
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const sessions = new Map<string, SessionEntry>();

export function createSession(user: SessionUser): string {
  const token = crypto.randomUUID();
  sessions.set(token, { user, expires: Date.now() + SESSION_TTL_MS });
  return token;
}

export function getSession(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expires < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session.user;
}

export function deleteSession(token: string): void {
  sessions.delete(token);
}
