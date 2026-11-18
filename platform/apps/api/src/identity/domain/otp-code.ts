// OtpCode — 6-значний код безпеки. Генерація + хешування.
// Код у відкритому вигляді не зберігається (БД і логи не світять OTP):
// зберігаємо `${salt}:${sha256(salt + code)}`.

import { createHash, randomBytes, randomInt } from 'node:crypto';
import { uuidv7 } from '@fade/domain-shared';

export const OTP_DIGITS = 6;

export function generateOtpCode(): string {
  return String(randomInt(0, 10 ** OTP_DIGITS)).padStart(OTP_DIGITS, '0');
}

export function hashOtpCode(code: string): string {
  const salt = randomBytes(8).toString('hex');
  return `${salt}:${createHash('sha256').update(`${salt}${code}`).digest('hex')}`;
}

export function otpMatches(storedHash: string, candidate: string): boolean {
  const sep = storedHash.indexOf(':');
  if (sep === -1) return false;
  const salt = storedHash.slice(0, sep);
  const digest = createHash('sha256').update(`${salt}${candidate}`).digest('hex');
  return storedHash === `${salt}:${digest}`;
}

// Session token — випадковий bearer/cookie (до T-011, де його клеїть адаптер cookie).
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateId(): string {
  return uuidv7();
}
