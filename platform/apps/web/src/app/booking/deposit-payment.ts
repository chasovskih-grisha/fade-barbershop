// T-4619b: стан кроку оплати депозиту. Дедлайн — лише серверний `expiresAt`;
// клієнт не додає власних 15 хвилин і не вважає спробу оплати успішною.

export type DepositPaymentStatus = 'payable' | 'paying' | 'paid' | 'expired' | 'failed' | 'unknown';

/** UUID v4 для Idempotency-Key; стабільний на одну спробу оплати. */
export function newPaymentRequestKey(): string {
  const source = globalThis.crypto;
  if (typeof source?.randomUUID === 'function') return source.randomUUID();

  const bytes = new Uint8Array(16);
  if (typeof source?.getRandomValues === 'function') source.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.random() * 256;
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function remainingMs(expiresAt: string, now = Date.now()): number {
  const deadline = new Date(expiresAt).getTime();
  if (Number.isNaN(deadline)) return 0;
  return Math.max(0, deadline - now);
}

/** `mm:ss`, а для утримань довших за годину — `h:mm:ss`. */
export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

/** Відповідь сервера — єдине джерело істини про результат списання. */
export function statusAfterPayment(outcome: string): DepositPaymentStatus {
  if (outcome === 'captured' || outcome === 'already_paid') return 'paid';
  if (outcome === 'expired') return 'expired';
  if (outcome === 'failed') return 'failed';
  return 'unknown';
}
