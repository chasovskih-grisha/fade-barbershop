---
id: T-4625
title: "Advanced Database Query Performance Auditing & Index Optimization"
status: todo
sp: 8
priority: high
category: database, performance, backend
phase: 40
milestone: M6
source: "docs/architecture.md, slo.md, engineering-principles.md"
adr: [0002, 0009]
screens: []
---

# T-4625: Advanced Database Query Performance Auditing & Index Optimization

## Overview

As historical appointment data, client logs, and analytics metrics accumulate, complex queries (such as availability slot calculation across multiple barbers, multi-criteria client searches, and financial aggregation reports) risk latency regression exceeding SLO thresholds (<200ms p95).

This task implements automated query performance auditing via PostgreSQL slow query logging, EXPLAIN ANALYZE telemetry, and missing index auto-recommendations integrated into the CI pipeline.

## Scope

- **Slow Query Telemetry & Logging**: Configure PostgreSQL statement timeout and slow query logging (>100ms) with export to Prometheus/Loki.
- **Index Coverage Audit**: Audit all foreign keys, date-range filters (appointment start/end), and JSONB search fields across Prisma models, adding missing composite indexes.
- **Query Optimization for Slot Calculation**: Refactor the availability slot generation query in `apps/api` to use optimized window functions and CTEs, reducing database roundtrips.
- **Automated Explain Analyze CI Check**: Add a migration linter step that warns or fails on sequential scans of large tables in new Prisma migrations.

## Why

Database query latency is the primary bottleneck for real-time booking responsiveness. Proactive index optimization ensures sub-second p95 latency under heavy peak loads.

## Sources

- `docs/architecture.md`
- `docs/slo.md`
- `docs/engineering-principles.md`

## Done

- [ ] PostgreSQL slow query monitoring dashboard active in Grafana
- [ ] Missing indexes identified and added via Prisma migrations
- [ ] Availability slot query execution time reduced by >50% in benchmarks
- [ ] CI migration linter validates query execution plans

## Risks

- [ ] **Index bloat on high-write tables (audit logs, telemetry).** Mitigation: Carefully analyze read/write ratio before adding indexes to append-only log tables.
- [ ] **Migration downtime on large production tables.** Use `CREATE INDEX CONCURRENTLY` for all production index additions.

## Out of scope

- Database sharding or read-replica scaling (single primary Postgres instance sufficient for multi-location rollout up to 10 locations)
- Migration to alternative database engines
