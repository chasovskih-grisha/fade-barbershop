# T-4520a · Composed Appointment: Domain & Price (3/8)

- **Stage**: M1 (phase 4) · **Tags**: backend, catalog, high-risk · **Complexity**: middle · **Depends on**: T-040, T-090
- **StoryPoints**: 3

## What
`Appointment`/booking step holds **positions** (list of services) rather than a single `serviceId`: each position is `serviceId`, `name` (snapshot), `duration`, `price`. `FinalPrice` = sum of position prices; `AgreedPrice` snapshots each position separately (T-090). Composite services do not create new SKUs in the catalog — composition is at the booking level only. Validation: ≥1 and ≤ max positions (upper limit is config, default 3), no duplicate services.

## Why
The domain model currently holds a single service per booking (booking-flow step 1). Positions with separate price/duration snapshots are the smallest change that enables "hair+beard" combinations without breaking fixed combos in the catalog. A separate Slice, because a stable price snapshot is a prerequisite for slots (T-4520b) and deposits.

## Sources
- `docs/booking-flow.md` §Screen 1 (single service — constraint being removed)
- `apps/api/src/billing` README / T-090 (`AgreedPrice` — sum of positions)
- `apps/api/src/scheduling/README.md` (Appointment aggregate)

## Done
- [ ] Positions in booking: type, validations (≥1, upper limit, no duplicates)
- [ ] `FinalPrice`/`AgreedPrice` calculated by positions; Tests (domain)
- [ ] API contract `packages/contracts` updated; `pnpm docs:validate` green

## Implementation plan

Paths:
- apps/api/src/scheduling/domain/appointment.aggregate.ts
- apps/api/src/scheduling/domain/appointment.aggregate.spec.ts

Checks:
- pnpm --filter api test apps/api/src/scheduling/domain/appointment.aggregate.spec.ts

## Implementation notes

- apps/api/src/scheduling/domain/appointment.aggregate.spec.ts
- apps/api/src/scheduling/domain/appointment.aggregate.ts

## QA

- `pnpm --filter api test apps/api/src/scheduling/domain/appointment.aggregate.spec.ts` exit 0
