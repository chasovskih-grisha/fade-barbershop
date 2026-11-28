# UUID data migration: expand/contract plan (T-4300c)

> The plan for moving existing integer-keyed data onto UUID v7 primary keys
> (ADR 0021). New tables use UUID from the start, and the dev database was
> retyped in T-4300b. This document covers the one case that can lose data:
> a database that already holds production rows when the migration runs.

## Decision

**Zero production data before the first deploy.** Prod has not been deployed
yet: ADR 0051 describes one GMHost VPS for prod only, and T-4614 brings the
site, admin and API up *before the first location*, with an empty catalog. So
no integer-keyed rows exist in prod, and the migration is the type change that
T-4300b already applied to the dev database — not a data backfill.

The expand/contract procedure below is the fallback, kept for the case where a
staging or a client database is filled before the retype.

## Verification checklist (zero-data branch)

- [ ] `apps/api/prisma/migrations` contains no migration that creates an
      `Int`/`BigInt` primary key or `autoincrement()`; `pnpm uuid:check` is green.
- [ ] `pnpm db:migration:check` is green on the migration folder.
- [ ] The prod database is created by `prisma migrate deploy` in the `db-init` one-shot before api start, and
      `db-seed` is not run there (T-4614b).
- [ ] A restore drill on a copy of prod confirms the dump restores onto the
      UUID schema.
- [ ] The checklist is re-run before each release that carries a schema change.

## Implementation plan — expand/contract procedure (data-exists branch)

Each step is a separate release. Rolling deploy means the previous api instance
still runs while the new schema is live, so every step stays compatible with the
code before it (`docs/engineering-principles.md` §zero-downtime migrations).

1. **Expand.** Add a nullable `uuid` column next to each integer key, add
   `@db.Uuid` foreign-key columns, and a `legacyId` mapping column where an
   external reference points at the old integer. Code writes both the old and
   the new column.
2. **Backfill.** Fill the new columns from the old keys in batches, with the
   `legacyId` map kept for external links (GET parameters, PDFs). The script is
   idempotent — a second run is a no-op — and a dry run on a staging copy is a
   precondition.
3. **Switch.** Read from the new columns only; the old columns keep receiving
   writes until the next release.
4. **Contract.** Drop the old integer columns and the `legacyId` map once no
   running instance reads them.

## Rollback per step

- **Expand** — drop the new columns; the old ones are untouched.
- **Backfill** — truncate the new columns and re-run; the script is idempotent.
- **Switch** — point reads back at the old columns; both are still populated.
- **Contract** — restore the old columns from the pre-contract dump and re-run
  the expand and backfill steps.

## Risks

- **Lost data.** External references to old integer ids (links, PDFs, exports)
  break on the switch. Inventory them into `legacyId` before the contract step.
- **Downtime.** Run the backfill in the night window and keep dual writes rather
  than stopping writes; batch size stays small enough to avoid long locks.
