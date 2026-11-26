// Idempotency keys (T-4207): клієнт надсилає `Idempotency-Key` (UUID v4), сервер
// 24 год памʼятає відповідь і на повтор віддає її ж. Тут лише чисті правила —
// зберігання живе в store, HTTP — в interceptor.
import { createHash } from 'node:crypto';

export const IDEMPOTENCY_HEADER = 'idempotency-key';
export const REPLAYED_HEADER = 'idempotency-replayed';
/** Stripe-стандарт: ключ живе добу, далі повтор трактується як новий запит. */
export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export const MUTATING_METHODS: ReadonlySet<string> = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidIdempotencyKey(key: string): boolean {
  return UUID_V4.test(key.trim());
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`);
    return `{${entries.join(',')}}`;
  }
  return String(JSON.stringify(value));
}

/** Той самий ключ із іншим тілом — це не повтор, а помилка клієнта (409). */
export function fingerprint(method: string, path: string, body: unknown): string {
  return createHash('sha256')
    .update(`${method.toUpperCase()} ${path} ${stable(body ?? null)}`)
    .digest('hex');
}

export type IdempotencyHeaders = Record<string, string | string[]>;

export interface IdempotencySnapshot {
  key: string;
  fingerprint: string;
  statusCode: number;
  body: unknown;
  /** Response headers set by the handler, replayed with the cached response. */
  headers?: IdempotencyHeaders;
  expiresAt: Date;
}

export type ReplayDecision =
  | { kind: 'fresh' }
  | { kind: 'replay'; statusCode: number; body: unknown; headers: IdempotencyHeaders }
  | { kind: 'conflict' };

export function decideReplay(
  stored: IdempotencySnapshot | null,
  requestFingerprint: string,
  now: Date
): ReplayDecision {
  if (!stored) return { kind: 'fresh' };
  if (stored.expiresAt.getTime() <= now.getTime()) return { kind: 'fresh' };
  if (stored.fingerprint !== requestFingerprint) return { kind: 'conflict' };
  return {
    kind: 'replay',
    statusCode: stored.statusCode,
    body: stored.body,
    headers: stored.headers ?? {},
  };
}

export function expiresAt(now: Date): Date {
  return new Date(now.getTime() + IDEMPOTENCY_TTL_MS);
}
