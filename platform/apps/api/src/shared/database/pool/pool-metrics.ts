// T-4803: метрики пулу у форматі Prometheus. Значення знімає проба
// (pg_stat_activity / SHOW max_connections), а рядки будує чиста функція —
// її ж використовує /metrics, тож формат перевіряється тестом, не скрейпом.

export interface DbPoolSnapshot {
  /** З'єднання, що виконують запит зараз. */
  active: number;
  /** Вільні з'єднання в пулі. */
  idle: number;
  /** Запити, що чекають на вільне з'єднання (0 для звичайного Prisma-пулу). */
  waiting: number;
  /** max_connections сервера (або pool_size PgBouncer). */
  maxConnections: number;
}

/** Скільки відсотків ліміту зайнято; 0, коли ліміт невідомий. */
export function poolUtilization(snapshot: DbPoolSnapshot): number {
  if (snapshot.maxConnections <= 0) return 0;
  return Math.round(((snapshot.active + snapshot.idle) / snapshot.maxConnections) * 1000) / 10;
}

/** Prometheus-рядки gauge-типу; порожній масив, якщо проби немає в графі. */
export function dbPoolExpositionLines(snapshot: DbPoolSnapshot | null): string[] {
  if (!snapshot) return [];
  const lines: string[] = [];
  const gauge = (name: string, help: string, value: number): void => {
    lines.push(`# HELP ${name} ${help}`);
    lines.push(`# TYPE ${name} gauge`);
    lines.push(`${name} ${value}`);
  };
  gauge('fade_db_pool_active_connections', 'Database connections currently executing a query.', snapshot.active);
  gauge('fade_db_pool_idle_connections', 'Idle database connections held by the pool.', snapshot.idle);
  gauge('fade_db_pool_waiting_requests', 'Requests waiting for a free database connection.', snapshot.waiting);
  gauge('fade_db_pool_max_connections', 'Connection limit (server max_connections or PgBouncer pool size).', snapshot.maxConnections);
  gauge('fade_db_pool_utilization_percent', 'Share of the connection limit in use, percent.', poolUtilization(snapshot));
  return lines;
}
