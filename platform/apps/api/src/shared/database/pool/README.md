# Пул з'єднань і PgBouncer (T-4803)

## Що тут

- `database-url.ts` — `resolvePoolSettings` (env → ліміти) і
  `applyPoolSettings` (вписує `connection_limit`, `pool_timeout`,
  `pgbouncer`/`statement_cache_size` у `DATABASE_URL`).
- `pool-metrics.ts` — Prometheus-рядки пулу (`fade_db_pool_*`).
- `db-pool-metrics.probe.ts` — проба `pg_stat_activity` + `SHOW max_connections`;
  будь-який збій → `null`, секція просто не емітиться.
- `db-pool.module.ts` — провайдить пробу; `MetricsModule` бере її через
  `ModuleRef` і додає `dbPool` до `/metrics`.

## Конфіг

| Змінна | Типово | Значення |
|--------|--------|----------|
| `DB_POOL_CONNECTION_LIMIT` | `10` | з'єднань на інстанс API |
| `DB_POOL_TIMEOUT_SECONDS` | `10` | скільки чекати вільне з'єднання |
| `DB_PGBOUNCER` | `false` | `true` → `pgbouncer=true&statement_cache_size=0` |

`DATABASE_URL` збирається на boot: `applyPoolSettings(process.env.DATABASE_URL, resolvePoolSettings())`.
Некоректне значення ліміту — `RangeError` на старті, а не тихе «0 з'єднань».

## PgBouncer (infra)

`pgbouncer.ini.example` — робочий шаблон transaction pooling для стека
`platform/infra/`: `pool_mode = transaction`, `max_client_conn = 1000`,
`default_pool_size = 20`. API підключається до порту PgBouncer (`6432`) з
`DB_PGBOUNCER=true`; міграції (`prisma migrate deploy`) ідуть ПРЯМИМ
з'єднанням на `5432` — transaction pooling не тримає advisory locks між
кроками міграції.

## Runbook

1. Підняти PgBouncer із шаблону, перевірити `SHOW POOLS;` (cl_waiting = 0).
2. API: `DATABASE_URL=postgresql://…@pgbouncer:6432/fade` + `DB_PGBOUNCER=true`.
3. `curl -s localhost:13000/metrics | grep fade_db_pool` — active/idle/max/utilization.
4. Алерт: `fade_db_pool_utilization_percent > 80` 5 хв, `fade_db_pool_waiting_requests > 0`.
5. Симптом «prepared statement already exists» = забутий `DB_PGBOUNCER=true`.

## Не покрито тут

Контейнер у `docker-compose.yml`, pgbouncer-експортер і навантажувальний тест
на 500 воркерів — infra/devops-скоуп (`platform/infra/`), поза цим лейном.
