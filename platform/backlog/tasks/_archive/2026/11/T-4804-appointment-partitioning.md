# T-4804 · Automated Partitioning & Archiving for Appointments & Audit Logs

- **Stage**: M3 · **Tags**: backend, database, maintenance · **Complexity**: senior · **Depends on**: T-042
- **StoryPoints**: 8

## What

Implement PostgreSQL table partitioning by date (monthly/quarterly) for high-volume tables (`Appointment`, `AppointmentParty`, `AuditLog`, `OutboxEvent`) to maintain query performance and streamline data retention management.

- Set up declarative partitioning on `Appointment` table by appointment date range.
- Automated partition creation script / pg_partman extension integration.
- Cold storage archiving workflow moving historical appointments older than 24 months to MinIO object storage (ADR 0018) as compressed Parquet/JSON archives.

## Why

As the barbershop chain grows across multiple locations over years, appointment and audit tables will accumulate millions of rows, degrading query performance on active calendars and analytics.

## Sources

- `platform/docs/architecture.md`, `platform/docs/seeding.md`
- ADR 0018 (MinIO storage)

## Done

- [ ] Declarative date partitioning schema migration created for `Appointment` and `AuditLog`
- [ ] Automated background job for creating upcoming monthly partitions in advance
- [ ] Archiving script exporting expired partitions to MinIO object storage with checksum verification
- [ ] Unit and integration tests verifying partition pruning efficiency on date-range queries

## Risks

- [ ] **Foreign key constraints**: PostgreSQL partitioning limitations with foreign keys referencing partitioned tables.

## Implementation notes

- apps/api/prisma/migrations/20261218000000_add_archive_run/migration.sql
- apps/api/prisma/schema.prisma
- apps/api/src/shared/archive/archive-bookings.use-case.spec.ts
- apps/api/src/shared/archive/archive-bookings.use-case.ts
- apps/api/src/shared/archive/archive-manifest.ts
- apps/api/src/shared/archive/archive.module.ts
- apps/api/src/shared/archive/archive.ports.ts
- apps/api/src/shared/archive/archive.worker.ts
- apps/api/src/shared/archive/file-archive.uploader.ts
- apps/api/src/shared/archive/partition-plan.spec.ts
- apps/api/src/shared/archive/partition-plan.ts
- apps/api/src/shared/archive/prisma-archive.store.ts

## Scope notes

Партиційована `booking` потребує переписування таблиці — DDL генерує
`partitionDdl`, виконує ops-крок у вікні обслуговування (runbook у
`shared/archive/README.md`). Архівування працює через порт `ARCHIVE_UPLOADER`:
у репо — файловий бекенд (`ARCHIVE_DIR`), S3/MinIO-клієнт зі SigV4 і pg_partman
— окремий infra-слайс. Перевірка pruning-у на мільйонах рядків неможлива без
живої БД.

## Implementation plan

Paths:
- apps/api/src/shared/archive/partition-plan.ts
- apps/api/src/shared/archive/partition-plan.spec.ts
- apps/api/src/shared/archive/archive-bookings.use-case.spec.ts

Checks:
- `pnpm --filter @fade/api exec jest apps/api/src/shared/archive/partition-plan.spec.ts apps/api/src/shared/archive/archive-bookings.use-case.spec.ts`

## QA

- `pnpm --filter @fade/api exec jest apps/api/src/shared/archive/partition-plan.spec.ts apps/api/src/shared/archive/archive-bookings.use-case.spec.ts` exit 0
