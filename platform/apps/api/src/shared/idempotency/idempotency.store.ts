// Порт сховища idempotency-ключів (T-4207): use case/interceptor не знає про
// Prisma, тести підставляють in-memory реалізацію.
import type { IdempotencySnapshot } from './idempotency';

export const IDEMPOTENCY_STORE = 'IDEMPOTENCY_STORE';

export interface IdempotencyStore {
  find(key: string): Promise<IdempotencySnapshot | null>;
  save(snapshot: IdempotencySnapshot): Promise<void>;
  /** Автоочищення TTL: повертає кількість прибраних записів. */
  purgeExpired(now: Date): Promise<number>;
}
