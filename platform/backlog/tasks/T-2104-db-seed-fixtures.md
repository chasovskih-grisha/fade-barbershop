# T-2104 · Test Environment Seed Fixtures (12/12) — done 2026-09-27

- **Stage**: M0 (phase 0) · **Tags**: backend, devops, testing · **Complexity**: junior · **Depends on**: T-002, T-012, T-021
- **StoryPoints**: 15 · **Status**: done (all slices closed; 15 = sum of slices a–d)

## What
Create seed files for test and dev environments: test users (clients, barbers, admins), bookings, services, locations. Use database seeders. Add scripts for fast data reloading.

## Why
Testing requires stable data. Seeding allows reproducing real scenarios. Dev environment is for development without affecting production.

## Sources
- docs/seeding.md — phantom 2026-09-22: file never existed; source accepted at task start
- `seeders/` directory → phantom 2026-09-27: repo conventions accepted — seed scripts live in `scripts/*.mjs` (data) and `src/seed-*.ts` (users), not in `prisma/seeders/`
- Test data from T-301

## Snapshot (2026-09-27)
Seed line closed with four slices — all green:
- **T-2104a** (clients) — `src/seed-customers.ts`: 5 demo clients, E.164 via `PhoneNumber.of`, idempotent upsert, env config for CI; `pnpm seed:customers`.
- **T-2104b** (barbers) — closed by audit: long living in `scripts/seed-dev.mjs` (barbers + StaffAssignment ×3 locations + AvailabilityWindow Mon–Sat).
- **T-2104c** (bookings) — `scripts/seed-appointments.mjs`: 12 bookings, all 6 statuses and all 4 sources, agreedPrice by location, sliding time; upsert by deterministic appointmentId; `pnpm seed:appointments`.
- **T-2104d** (shared e2e fixtures) — `@fade/test-utils` (ADR 0019), done earlier 2026-09-27.
- Plus existing: `scripts/seed-dev.mjs` (locations/services/chairs/channels/photos) and `src/seed-admin.ts` (founder-admin, T-013).

## "Fast data reloading" pipeline
- `pnpm seed` / `pnpm seed:dev` — locations+services+barbers → bookings (idempotent, over existing DB).
- `pnpm seed:customers`, `pnpm seed:admin`, `pnpm seed:appointments` — separately.
- `pnpm seed:e2e` — reset DB + FADE_SEED_FIXED_IDS (readable stable IDs: loc_KYY_01, bk_seed_01…) + admin + clients.

## Done
- [x] Seed clients (T-2104a), barbers (T-2104b), bookings (T-2104c), e2e fixtures (T-2104d)
- [x] Fast reloading scripts (seed / seed:dev / seed:e2e / individual)
- [x] Data validated (live runs on container DB; api 538/538, coverage EXIT=0)
