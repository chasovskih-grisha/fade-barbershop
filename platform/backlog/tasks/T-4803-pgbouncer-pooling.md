# T-4803 · Database Connection Pooling Tuning with PgBouncer

- **Stage**: M0 / M3 · **Tags**: backend, database, infra · **Complexity**: middle · **Depends on**: T-001, T-002
- **StoryPoints**: 5

## What

Configure and integrate PgBouncer connection pooler in front of PostgreSQL for NestJS API (`apps/api`) to handle connection spikes and prevent database connection exhaustion during peak booking hours.

- Configure PgBouncer in transaction pooling mode in `platform/infra/`.
- Adjust Prisma client connection parameters (`connection_limit`, `pool_timeout`) to work seamlessly with PgBouncer.
- Monitor active connections, queue depth, and pool exhaustion metrics via Prometheus.

## Why

Direct PostgreSQL connections from multiple NestJS server instances can quickly exhaust max_connections under traffic spikes, leading to 503 service unavailable errors.

## Sources

- `platform/docs/architecture.md`, `platform/infra/docker-compose.yml`
- `platform/docs/engineering-principles.md`

## Done

- [ ] PgBouncer container added to docker-compose and configured for transaction pooling
- [ ] Prisma connection strings updated to use PgBouncer port
- [ ] Load testing validating stable connection usage under 500 concurrent API workers
- [ ] Prometheus metrics exported for PgBouncer pool stats

## Risks

- [ ] **Transaction pooling limitations**: Issues with prepared statements or session-level state (SET statements) mitigated by connection configuration.

## Implementation plan

Paths:
- apps/api/src/shared/database/pool/database-url.ts
- apps/api/src/shared/database/pool/database-url.spec.ts
- apps/api/src/shared/database/pool/pool-metrics.spec.ts

Checks:
- `pnpm --filter @fade/api exec jest apps/api/src/shared/database/pool/database-url.spec.ts apps/api/src/shared/database/pool/pool-metrics.spec.ts`

## Implementation notes

- apps/api/src/shared/database/pool/database-url.spec.ts
- apps/api/src/shared/database/pool/database-url.ts
- apps/api/src/shared/database/pool/db-pool-metrics.probe.spec.ts
- apps/api/src/shared/database/pool/db-pool-metrics.probe.ts
- apps/api/src/shared/database/pool/db-pool.module.ts
- apps/api/src/shared/database/pool/pool-metrics.spec.ts
- apps/api/src/shared/database/pool/pool-metrics.ts
- apps/api/src/shared/metrics/metrics-exposition.geocoder-pool.ts
- apps/api/src/shared/metrics/metrics-exposition.ts
- apps/api/src/shared/metrics/metrics.controller.ts
- apps/api/src/shared/prisma/prisma.service.ts

## Scope notes

Реалізовано API-бік: `DB_POOL_*` вписуються в `DATABASE_URL` на boot,
`DB_PGBOUNCER=true` глушить prepared statements, `/metrics` віддає
`fade_db_pool_*`. Шаблон `pgbouncer.ini.example` і README — для `platform/infra`,
але сам контейнер, pgbouncer-exporter і навантажувальний тест на 500 воркерів
належать devops-лейну (infra), тому їх тут немає.

## QA

- `pnpm --filter @fade/api exec jest apps/api/src/shared/database/pool/database-url.spec.ts apps/api/src/shared/database/pool/pool-metrics.spec.ts` exit 0
