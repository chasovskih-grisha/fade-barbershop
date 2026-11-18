// Вибір адаптера лока (T-4802): REDIS_LOCK_URLS (кворум інстансів) або
// REDIS_URL (один інстанс) → RedisSlotLock, інакше in-memory для dev/test.
// ioredis тягнеться ледачо, як у rate-limit (T-4410): без Redis пакет не грузиться.
import type { Provider } from '@nestjs/common';
import { SLOT_LOCK_AUDIT, SLOT_LOCK_STORE, type SlotLockStore } from '../application/slot-lock.ports';
import { SlotReservations, type SlotReservationsConfig } from '../application/slot-reservations.service';
import { InMemorySlotLock } from './in-memory-slot-lock';
import { RedisSlotLock, type RedisLockClient } from './redis-slot-lock';
import { SlotLockAuditLogger } from './slot-lock.audit.logger';

export const SLOT_RESERVATION_CONFIG = 'SLOT_RESERVATION_CONFIG';

export function redisLockUrls(env: NodeJS.ProcessEnv): string[] {
  const list = env.REDIS_LOCK_URLS?.split(',').map((url) => url.trim()).filter(Boolean);
  if (list?.length) return list;
  return env.REDIS_URL ? [env.REDIS_URL] : [];
}

export function buildSlotLockStore(env: NodeJS.ProcessEnv): SlotLockStore {
  const urls = redisLockUrls(env);
  if (urls.length === 0) return new InMemorySlotLock();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Redis = require('ioredis');
  const clients = urls.map((url) => new Redis(url) as RedisLockClient);
  return new RedisSlotLock(clients);
}

const SlotLockStoreProvider: Provider = {
  provide: SLOT_LOCK_STORE,
  useFactory: (): SlotLockStore => buildSlotLockStore(process.env),
};

const SlotLockConfigProvider: Provider = {
  provide: SLOT_RESERVATION_CONFIG,
  useFactory: (): Partial<SlotReservationsConfig> => {
    const config: Partial<SlotReservationsConfig> = {};
    const ttlMs = Number(process.env.SLOT_RESERVATION_TTL_MS);
    const maxAttempts = Number(process.env.SLOT_LOCK_MAX_ATTEMPTS);
    if (ttlMs > 0) config.ttlMs = ttlMs;
    if (maxAttempts > 0) config.maxAttempts = maxAttempts;
    return config;
  },
};

const SlotReservationsProvider: Provider = {
  provide: SlotReservations,
  useFactory: (
    store: SlotLockStore,
    audit: SlotLockAuditLogger,
    config: Partial<SlotReservationsConfig>
  ) => new SlotReservations(store, audit, { config: { ...defaultConfig(), ...stripUndefined(config) } }),
  inject: [SLOT_LOCK_STORE, SLOT_LOCK_AUDIT, SLOT_RESERVATION_CONFIG],
};

function defaultConfig(): SlotReservationsConfig {
  return { ttlMs: 60_000, maxAttempts: 3 };
}

function stripUndefined(config: Partial<SlotReservationsConfig>): SlotReservationsConfig {
  return {
    ttlMs: config.ttlMs ?? defaultConfig().ttlMs,
    maxAttempts: config.maxAttempts ?? defaultConfig().maxAttempts,
  };
}

export const slotLockProviders: Provider[] = [
  SlotLockStoreProvider,
  { provide: SLOT_LOCK_AUDIT, useClass: SlotLockAuditLogger },
  SlotLockConfigProvider,
  SlotReservationsProvider,
];
