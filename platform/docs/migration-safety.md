# Migration Safety (T-4209, T-4210)

## Overview

This document describes the migration safety procedures for the Prisma migration workflow. It covers baseline strategies, dry-run verification, and rollback procedures to ensure safe database schema changes with zero downtime.

## T-4209: Baseline Strategy & Rollback Coverage

### Baseline (Grandfathered Migrations)

The project maintains a `rollback-baseline.json` file that lists migrations considered "grandfathered" — these are migrations already deployed to production and tracked in Prisma's history. Grandfathered migrations are exempt from the rollback.sql requirement because they have already been applied to the production database.

**Baseline file:** `platform/apps/api/prisma/migrations/rollback-baseline.json`

**How it works:**
- Migrations listed in `grandfathered` are exempt from the `check-migration-rollback.mjs` gate
- New migrations (not in the baseline) must have a `rollback.sql` file in their migration directory
- The baseline can be narrowed (adding more migrations) but should not be expanded without review

**When to update the baseline:**
- After a migration has been successfully deployed to production and verified
- When migrating to a new environment where all prior migrations need to be considered "already applied"
- Before removing the rollback.sql requirement for a migration that has proven safe

### Rollback Strategy

Every **new** migration (not in the baseline) must have an accompanying `rollback.sql` file in its migration directory (`platform/apps/api/prisma/migrations/<migration-name>/rollback.sql`).

**Requirements for rollback.sql:**
- Must exist and be non-empty (the `check-migration-rollback.mjs` gate validates this)
- Should contain the SQL needed to reverse the migration's changes
- Should be tested alongside the forward migration

**How to roll back a failed migration:**

1. **Identify the failed migration** from the error output or deployment logs
2. **Run rollback manually:**
   ```bash
   npx prisma migrate resolve --rolled-back <migration-name>
   ```
3. **Apply the rollback.sql manually** against the database if automatic resolution doesn't fully restore the previous state
4. **Redeploy the application** with the previous code version
5. **Investigate the failure** and fix the migration before re-deploying

**Never skip the rollback.sql requirement** for new migrations — rolling back without a documented rollback script is risky and may result in data loss.

### When to Use `prisma migrate reset` vs `prisma migrate deploy`

| Scenario | Command | Effect |
|-----------|---------|--------|
| Fresh/dev database, no data | `prisma migrate reset --force` | Resets the database entirely, applies all migrations from scratch. Use only when you can afford to lose all data. |
| Production database, applying new migrations | `prisma migrate deploy` | Applies pending migrations to the production database. Safe for adding new schema changes. |
| Recovery from failed migration | `prisma migrate resolve --rolled-back <name>` + manual SQL | Marks a migration as rolled back in Prisma's history, then manually execute restoration SQL. Use when `prisma migrate dev` fails mid-apply. |
| Narrowing the baseline | Manually edit `rollback-baseline.json` | Add migration names to `grandfathered` list after they've been verified as safely applied to production. |

### Migration Safety Checklist

Before committing any migration:

- [ ] **SQL safety check:** Run `pnpm db:migration:check` — validates no destructive operations (DROP, TRUNCATE, DELETE without WHERE, RENAME, SET NOT NULL without backfill)
- [ ] **Rollback coverage:** If new migration (not in baseline), ensure `rollback.sql` exists and is non-empty
- [ ] **Expand/contract separation:** `ADD COLUMN ... NOT NULL` without DEFAULT must be split into two migrations: first nullable column + backfill, then `SET NOT NULL` separately
- [ ] **Baseline review:** Verify the migration is either new (needs rollback.sql) or grandfathered (in baseline)
- [ ] **Test run:** Run `pnpm db:migration:test` — unit tests for the migration safety gate
- [ ] **CI gate:** Ensure both `db:migration:check` and `db:migration:rollback:check` pass

## T-4210: Dry-Run Verification

### Validating Schema Changes Before Apply

Before applying migrations to any environment, validate the schema changes using these methods:

#### 1. `prisma migrate diff` (Recommended)

Compares the current Prisma schema against the database state to generate the SQL that would be applied:

```bash
# From the api directory
npx prisma migrate diff --from-url "postgresql://..." --to-url "postgresql://..."
```

**What to check:**
- Review the generated SQL for unintended data loss
- Verify column types and constraints match expectations
- Confirm no dropping of columns or tables that should be preserved
- Ensure index additions are intentional

#### 2. Local Dev Preview

```bash
# Apply migrations to local dev database
prisma migrate dev --name "<migration-name>"
```

**What to check:**
- The migration applies without error
- Prisma Client generates successfully (`npx prisma generate`)
- No TypeScript errors in the generated client
- App starts successfully with the new schema

#### 3. Schema Preview

```bash
npx prisma migrate show
```

**What to check:**
- Lists all applied and pending migrations
- Validates the migration history is consistent
- Ensures no migrations are stuck or in a failed state

### Pre-Deploy Checklist

Before deploying migrations to staging or production:

- [ ] Run `pnpm db:migration:check` — SQL gate passes (T-4812)
- [ ] Run `pnpm db:migration:rollback:check` — rollback coverage passes (T-4209)
- [ ] Run `pnpm db:migration:test` — unit tests pass
- [ ] Run `npx prisma generate` — Prisma Client regenerates without errors
- [ ] Run `npx tsc --noEmit` — TypeScript compiles clean
- [ ] Run `npm run lint` — ESLint passes with zero violations
- [ ] Review migration SQL manually for business logic impact
- [ ] Confirm the migration is listed in the changelog or backlog

### Emergency Recovery Procedure

If a migration fails partway through deployment:

1. **Stop** all application instances that might be running with the new schema
2. **Mark the failed migration as rolled back:**
   ```bash
   npx prisma migrate resolve --rolled-back <migration-name>
   ```
3. **Manually restore the database** using the rollback.sql from that migration (or the previous known-good backup)
4. **Redeploy** the application with the previous code version
5. **Investigate** the root cause — fix the migration SQL, add missing rollback, or adjust the baseline
6. **Re-run the safety checks** before re-deploying

## Verification Test

The project includes migration safety tests that validate the gate logic:

- `pnpm db:migration:test` — runs `check-migration-safety.test.mjs`
- `pnpm db:migration:rollback:test` — runs `check-migration-rollback.test.mjs`

**These tests verify:**
- DROP TABLE/COLUMN triggers violations
- TRUNCATE/DELETE FROM without WHERE triggers violations
- ADD COLUMN ... NOT NULL without DEFAULT triggers violations
- ADD COLUMN nullable (expand) is allowed
- ADD COLUMN IF NOT EXISTS is allowed
- CREATE TABLE/CREATE INDEX are safe
- ALTER COLUMN TYPE is safe
- Rollback files exist for new migrations
- Grandfathered migrations are exempt from rollback requirement
- Empty rollback.sql files are flagged as violations

Run these tests before committing any migration:

```bash
pnpm db:migration:test
pnpm db:migration:rollback:test
```

## Summary

**T-4209** ensures every new migration has rollback coverage, with grandfathered migrations tracked in `rollback-baseline.json`.

**T-4210** provides the verification workflow: SQL safety gates, diff preview, local dev testing, and CI gates.

**Together**, these procedures prevent production downtime from faulty migrations and provide clear recovery paths when things go wrong.

---
*Last updated: 2026-11-27*
*Maintained by: Development Team*
*Related ADRs: engineering-principles.md §Міграції без downtime*