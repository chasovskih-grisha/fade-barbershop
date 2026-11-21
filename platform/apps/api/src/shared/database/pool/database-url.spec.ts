// T-4803: пул з'єднань — розбір env і переписування DATABASE_URL.
import { DEFAULT_POOL_SETTINGS, applyPoolSettings, resolvePoolSettings } from './database-url';

const BASE = 'postgresql://fade:secret@db:5432/fade?schema=public';

describe('pool settings (T-4803)', () => {
  it('типові значення: 10 з’єднань, 10 с таймаут, без PgBouncer', () => {
    expect(resolvePoolSettings({} as NodeJS.ProcessEnv)).toEqual(DEFAULT_POOL_SETTINGS);
    expect(DEFAULT_POOL_SETTINGS.pgbouncer).toBe(false);
  });

  it('читає env-перевизначення', () => {
    const settings = resolvePoolSettings({
      DB_POOL_CONNECTION_LIMIT: '25',
      DB_POOL_TIMEOUT_SECONDS: '3',
      DB_PGBOUNCER: 'true',
    } as NodeJS.ProcessEnv);
    expect(settings).toEqual({ connectionLimit: 25, poolTimeoutSeconds: 3, pgbouncer: true });
  });

  it('відкидає некоректні ліміти замість тихого дефолту', () => {
    expect(() =>
      resolvePoolSettings({ DB_POOL_CONNECTION_LIMIT: '0' } as NodeJS.ProcessEnv)
    ).toThrow(RangeError);
    expect(() =>
      resolvePoolSettings({ DB_POOL_TIMEOUT_SECONDS: 'many' } as NodeJS.ProcessEnv)
    ).toThrow(RangeError);
  });

  it('вписує pool-параметри, зберігаючи schema', () => {
    const url = new URL(
      applyPoolSettings(BASE, { connectionLimit: 7, poolTimeoutSeconds: 5, pgbouncer: false })
    );
    expect(url.searchParams.get('connection_limit')).toBe('7');
    expect(url.searchParams.get('pool_timeout')).toBe('5');
    expect(url.searchParams.get('schema')).toBe('public');
    expect(url.searchParams.get('pgbouncer')).toBeNull();
  });

  it('у режимі PgBouncer вимикає prepared statements', () => {
    const url = new URL(
      applyPoolSettings(BASE, { connectionLimit: 10, poolTimeoutSeconds: 10, pgbouncer: true })
    );
    expect(url.searchParams.get('pgbouncer')).toBe('true');
    expect(url.searchParams.get('statement_cache_size')).toBe('0');
  });

  it('прибирає pgbouncer-параметри після переходу на пряме з’єднання', () => {
    const direct = 'postgresql://fade:secret@db:5432/fade?pgbouncer=true&statement_cache_size=0';
    const url = new URL(
      applyPoolSettings(direct, { connectionLimit: 4, poolTimeoutSeconds: 2, pgbouncer: false })
    );
    expect(url.searchParams.get('pgbouncer')).toBeNull();
    expect(url.searchParams.get('statement_cache_size')).toBeNull();
  });

  it('відмовляє на не-postgres URL', () => {
    expect(() => applyPoolSettings('mysql://x/y')).toThrow(RangeError);
    expect(() => applyPoolSettings('not-a-url')).toThrow(RangeError);
  });
});
