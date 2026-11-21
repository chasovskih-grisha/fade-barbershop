// Параметри пулу з'єднань (T-4803). Prisma не читає окремих env-змінних —
// ліміти живуть у рядку DATABASE_URL, тому рахуємо/вписуємо їх тут, а не
// розкидаємо рядки по коду. Transaction pooling у PgBouncer вимагає
// `pgbouncer=true`, інакше Prisma готує іменовані prepared statements, які
// PgBouncer не переносить між транзакціями.
//
// Конфіг: DB_POOL_CONNECTION_LIMIT (дефолт 10), DB_POOL_TIMEOUT_SECONDS
// (дефолт 10), DB_PGBOUNCER=true, коли API ходить через PgBouncer.

export interface PoolSettings {
  connectionLimit: number;
  poolTimeoutSeconds: number;
  pgbouncer: boolean;
}

export const DEFAULT_POOL_SETTINGS: PoolSettings = {
  connectionLimit: 10,
  poolTimeoutSeconds: 10,
  pgbouncer: false,
};

function positiveInt(raw: string | undefined, fallback: number, name: string): number {
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer, got "${raw}"`);
  }
  return value;
}

/** Settings із env; непридатне значення — помилка, а не тихе замовчування. */
export function resolvePoolSettings(env: NodeJS.ProcessEnv = process.env): PoolSettings {
  return {
    connectionLimit: positiveInt(
      env.DB_POOL_CONNECTION_LIMIT,
      DEFAULT_POOL_SETTINGS.connectionLimit,
      'DB_POOL_CONNECTION_LIMIT'
    ),
    poolTimeoutSeconds: positiveInt(
      env.DB_POOL_TIMEOUT_SECONDS,
      DEFAULT_POOL_SETTINGS.poolTimeoutSeconds,
      'DB_POOL_TIMEOUT_SECONDS'
    ),
    pgbouncer: env.DB_PGBOUNCER === 'true',
  };
}

/**
 * Повертає DATABASE_URL із застосованими pool-параметрами. Наявні параметри,
 * які ми не керуємо (schema, sslmode, connect_timeout), лишаються як є.
 */
export function applyPoolSettings(
  databaseUrl: string,
  settings: PoolSettings = DEFAULT_POOL_SETTINGS
): string {
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new RangeError('DATABASE_URL is not a valid URL');
  }
  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new RangeError(`DATABASE_URL must be postgres/postgresql, got "${parsed.protocol}"`);
  }
  parsed.searchParams.set('connection_limit', String(settings.connectionLimit));
  parsed.searchParams.set('pool_timeout', String(settings.poolTimeoutSeconds));
  if (settings.pgbouncer) {
    parsed.searchParams.set('pgbouncer', 'true');
    // Prepared statements несумісні з transaction pooling — глушимо явно.
    parsed.searchParams.set('statement_cache_size', '0');
  } else {
    parsed.searchParams.delete('pgbouncer');
    parsed.searchParams.delete('statement_cache_size');
  }
  return parsed.toString();
}
