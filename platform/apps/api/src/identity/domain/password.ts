// Password — пароль адміна (T-013). У відкритому вигляді не зберігається:
// scrypt-хеш із випадковою сіллю (`scrypt:${salt}:${digest}`), порівняння — constant-time.
// Клієнтський OTP-контур паролів не використовує (ADR 0005).

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const PASSWORD_MIN_LENGTH = 8;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const digest = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${digest}`;
}

export function passwordMatches(storedHash: string, candidate: string): boolean {
  const [algo, salt, expectedHex] = storedHash.split(':');
  if (algo !== 'scrypt' || !salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = scryptSync(candidate, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
