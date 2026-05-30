import crypto from 'crypto';

export type UserRole = 'admin' | 'cashier';

export interface SessionUser {
  id: number;
  username: string;
  role: UserRole;
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/** In-memory fallback for local file-store dev only */
const memorySessions = new Map<string, { user: SessionUser; expires: number }>();

function getSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.MONGODB_URI;
  if (!secret) {
    throw new Error('JWT_SECRET or MONGODB_URI must be set for authentication');
  }
  return secret;
}

function signToken(user: SessionUser): string {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token: string): SessionUser | null {
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as SessionUser & {
      exp: number;
    };
    if (!payload.exp || payload.exp < Date.now()) return null;
    return { id: payload.id, username: payload.username, role: payload.role };
  } catch {
    return null;
  }
}

export function createSession(user: SessionUser): string {
  if (process.env.VERCEL || process.env.JWT_SECRET || process.env.MONGODB_URI) {
    return signToken(user);
  }
  const token = crypto.randomUUID();
  memorySessions.set(token, { user, expires: Date.now() + SESSION_TTL_MS });
  return token;
}

export function getSession(token: string | undefined): SessionUser | null {
  if (!token) return null;

  const jwtUser = verifyToken(token);
  if (jwtUser) return jwtUser;

  const session = memorySessions.get(token);
  if (!session || session.expires < Date.now()) {
    memorySessions.delete(token);
    return null;
  }
  return session.user;
}

export function deleteSession(token: string): void {
  memorySessions.delete(token);
}
