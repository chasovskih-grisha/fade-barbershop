import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * T-4619: підписаний resume-токен депозиту.
 *
 * Єдина роль — дати **анонімному** запису дочитати стан свого депозиту після
 * перезавантаження сторінки. Це не сесія, не авторизація барбера чи адміна і
 * не ключ до довільного booking-id: токен лише засвідчує, що викликач отримав
 * відповідь на створення саме цього запису, і приймається тільки на
 * `GET /payment/bookings/:bookingId/deposit`. Іменований запис читає свій
 * депозит клієнтською сесією.
 */
export const DEPOSIT_RESUME_HEADER = 'x-deposit-resume-token';

/** Секрет читається на виклик, а не на імпорт: модуль не падає без змінної. */
function secret(): string {
  const value = process.env.DEPOSIT_RESUME_SECRET;
  if (!value) throw new Error('DEPOSIT_RESUME_SECRET is required');
  return value;
}

export function depositResumeToken(bookingId: string): string {
  return createHmac('sha256', secret()).update(bookingId).digest('base64url');
}

export function isValidDepositResumeToken(bookingId: string, token: string): boolean {
  const expected = Buffer.from(depositResumeToken(bookingId));
  const actual = Buffer.from(token);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
