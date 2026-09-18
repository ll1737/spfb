import crypto from 'node:crypto';

export interface SessionRecord {
  userId: string;
  expiresAt: number;
}

export function createSessionToken(): string {
  return `tok_${crypto.randomBytes(32).toString('hex')}`;
}

export function readBearerToken(header: string | undefined): string | null {
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token || null;
}

export function resolveSessionUser<T extends { id: string }>(
  authorization: string | undefined,
  sessions: Map<string, SessionRecord>,
  users: T[],
  now = Date.now()
): T | null {
  const token = readBearerToken(authorization);
  if (!token) return null;

  const session = sessions.get(token);
  if (!session) return null;
  if (now > session.expiresAt) {
    sessions.delete(token);
    return null;
  }

  return users.find((user) => user.id === session.userId) || null;
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 120_000, 64, 'sha512').toString('hex');
}
