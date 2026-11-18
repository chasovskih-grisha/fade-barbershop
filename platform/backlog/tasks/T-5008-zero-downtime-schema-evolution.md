---
id: T-5008
title: "Zero-Downtime Database Schema Evolution & Expand-Contract Framework"
status: split
sp: 8
priority: high
category: database, devops, backend
phase: 50
milestone: M10
source: "docs/architecture.md, docs/slo.md, engineering-principles.md"
adr: [0005, 0014]
screens: ["admin-screens.md"]
---

# T-5008: Zero-Downtime Database Schema Evolution & Expand-Contract Framework

## Overview

As the barbershop platform scales to multi-location operations with high concurrent booking volumes, schema migrations on heavily written tables (such as `appointments`, `payments`, and `ledger_entries`) risk downtime, table locks, or application errors during rolling deploys.

This task establishes a rigorous "Expand-Contract" database migration framework and automated CI linting rules to enforce zero-downtime migration patterns (e.g., forbidding unsafe `ALTER TABLE` locks, requiring multi-step column additions, backfilling, and safe deprecation).

## Scope

- **Expand-Contract Migration Pattern**: Standardized guidelines and TypeScript decorators/helpers for multi-phase schema migrations (Expand -> Dual-Write -> Backfill -> Contract).
- **CI Migration Linter**: Automated GitHub Action (`T-4807`) using pg-meta / sqlfluff to reject unsafe DDL statements (e.g., adding NOT NULL columns without default, exclusive table locks, dropping columns in active use).
- **Online Index Building**: Enforcing `CREATE INDEX CONCURRENTLY` for all production indexes to prevent write blocking.
- **Rollback Safety & Verification**: Automated pre-migration and post-migration integrity verification scripts.

## Acceptance Criteria

1. CI pipeline automatically blocks PRs containing unsafe PostgreSQL DDL operations on production tables.
2. All upcoming schema migrations adhere strictly to the Expand-Contract pattern with zero locking downtime on benchmark tests.
3. A developer guide for the expand-contract pattern is published with the migration rules.
