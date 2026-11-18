# T-4209 · Safe Database Migrations

- **Stage**: M5 (phase 30) · **Tags**: backend, devops, infra, high-risk · **Complexity**: senior · **Depends on**: T-002, T-001
- **StoryPoints**: 15

## What
Zero-downtime migrations: expand/contract pattern (Add column → deploy → backfill → drop old), rollback scripts for every migration, online schema changes (gh-ost / pt-online-schema-change for large tables: appointments, audit_logs, outbox), migration testing (CI: apply → test → rollback → test), shadow tables for safe backfill, advisory locks for coordination, migration observability (progress, ETA, pause/resume), backward-compatibility window (2 API versions).

## Why
Migrations must not cause downtime. Large tables require online tools. Rollback = safety insurance.

## Sources
- docs/engineering-principles.md
- gh-ost / pt-osc / Atlas / golang-migrate
- ADR 0018 (Docker dev; source: engineering-principles.md — migrations)

## dependencies
> Slices are created at task start; individual subtask files are created then if needed.
