// T-4803: метрики пулу — формат рядків і розрахунок утилізації.
import { dbPoolExpositionLines, poolUtilization, type DbPoolSnapshot } from './pool-metrics';

const SNAPSHOT: DbPoolSnapshot = { active: 4, idle: 6, waiting: 0, maxConnections: 20 };

describe('db pool metrics (T-4803)', () => {
  it('ематить gauge-рядки для всіх полів пулу', () => {
    const text = dbPoolExpositionLines(SNAPSHOT).join('\n');
    expect(text).toContain('# TYPE fade_db_pool_active_connections gauge');
    expect(text).toContain('fade_db_pool_active_connections 4');
    expect(text).toContain('fade_db_pool_idle_connections 6');
    expect(text).toContain('fade_db_pool_waiting_requests 0');
    expect(text).toContain('fade_db_pool_max_connections 20');
  });

  it('утилізація — частка ліміту, округлена до 0.1%', () => {
    expect(poolUtilization(SNAPSHOT)).toBe(50);
    expect(poolUtilization({ active: 1, idle: 0, waiting: 0, maxConnections: 3 })).toBe(33.3);
  });

  it('без ліміту утилізація нульова, а не ділення на нуль', () => {
    expect(poolUtilization({ active: 1, idle: 1, waiting: 0, maxConnections: 0 })).toBe(0);
  });

  it('без проби в графі секції немає', () => {
    expect(dbPoolExpositionLines(null)).toEqual([]);
  });
});
