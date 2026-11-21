// T-4803: pg_stat_activity віддає bigint — перевіряємо конверсію й порожні
// рядки (БД без прав на pg_stat_activity не має ламати /metrics).
import { toPoolSnapshot } from './db-pool-metrics.probe';

describe('toPoolSnapshot (T-4803)', () => {
  it('конвертує bigint-лічильники у числа', () => {
    expect(toPoolSnapshot({ active: 3n, idle: 7n }, '100')).toEqual({
      active: 3,
      idle: 7,
      waiting: 0,
      maxConnections: 100,
    });
  });

  it('без рядків — нульовий снапшот, без NaN', () => {
    expect(toPoolSnapshot(undefined, undefined)).toEqual({
      active: 0,
      idle: 0,
      waiting: 0,
      maxConnections: 0,
    });
  });

  it('максимум може прийти рядком', () => {
    expect(toPoolSnapshot({ active: 1, idle: 0 }, '25').maxConnections).toBe(25);
  });
});
