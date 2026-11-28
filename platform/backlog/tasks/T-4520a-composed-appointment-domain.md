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

## Audit 2026-11-24

Reopened to `todo`. `Appointment` still has a single `serviceId`; there are no
position/value objects, no position price snapshot, and no contracts change. The
only composed-service code in the tree is the slot-span optimizer, which does not
implement this slice. The implementation-note paths point at an aggregate/spec that
does not contain positions, so the QA command cannot prove the Done criteria.

## Reopening slices (2026-11-25)

Order: S1 → S2 → S3. Today `servicePositions` exists only in memory: `composed-slot-span.ts`
carries `{ serviceId, durationMinutes }` for T-4520b, `Booking` persists no positions, and
`AgreedPrice` still arrives from the caller. These slices close that gap; the Done boxes close
after all three.

### S1 · Position value object and validation (domain)

Files:
- `apps/api/src/scheduling/domain/booking-position.ts` (new) — `BookingPosition { serviceId, name,
  duration, price }`, `assertBookingPositions(positions, { max = 3 })` (≥1, ≤ max, unique
  `serviceId`, integer duration 5..480, price ≥ 0) and `positionsTotal`
- `apps/api/src/scheduling/domain/composed-slot-span.ts` — map `BookingPosition[]` to
  `ServicePosition[]` (or make `ServicePosition` an alias) so `compositionDuration` stays the single
  duration rule

Testable Done:
- Empty list, 4 positions with `max: 3`, duplicate `serviceId`, duration `0` and negative price each
  throw a named domain error with the offending service id.
- Three distinct positions pass; `positionsTotal` equals the arithmetic sum of `price`.
- Single position yields the same duration as today's `compositionDuration` call (no T-4520b
  regression).

Check: `pnpm --filter @fade/api exec jest src/scheduling/domain/booking-position.spec.ts src/scheduling/domain/composed-slot-span.spec.ts`

### S2 · Persist positions and derive the price from them

Files:
- `apps/api/prisma/schema.prisma` — `servicePositions Json?` on `Booking`, migration
  `apps/api/prisma/migrations/<ts>_add_booking_service_positions/`
- `apps/api/src/scheduling/domain/booking.data.ts` — store `BookingPosition[]` instead of the
  duration-only shape; `resolveFinalPrice` = `positionsTotal` when positions exist (then subtract
  `appliedDiscounts`), `agreedPrice` snapshotted from the same sum
- `apps/api/src/scheduling/application/book-appointment.use-case.ts` — server resolves each position’s
  `name`/`duration`/`price` from the catalog and location price list; client-sent prices are ignored
- `apps/api/src/scheduling/infrastructure/client-bookings.controller.ts` — accept
  `positions: [{ serviceId }]` (or the existing single `serviceId`) and reject mixed payloads

Testable Done:
- A booking with two positions persists both snapshots (`serviceId`, `name`, `duration`, `price`) in
  `Booking.servicePositions`; changing the catalog afterwards leaves the row unchanged.
- `agreedPrice`/`finalPrice` equal the sum of position prices minus recorded discounts; the deposit
  amount is derived from that final price, not from a client field.
- A client-supplied price in the payload is ignored (response price comes from the catalog).
- A single-service booking (no `positions`) stores the same `serviceId`/price/duration as before the
  slice — existing `book-appointment.pricing.spec.ts` stays green.

Check: `pnpm --filter @fade/api exec jest src/scheduling/domain/booking.data.spec.ts src/scheduling/application/book-appointment.pricing.spec.ts src/scheduling/infrastructure/client-bookings.controller.spec.ts`

### S3 · Shared contract and documented flow

Files:
- `packages/contracts/src/` — export `BookingPositionInput`/`BookingPositionSnapshot` and the create
  request shape `{ locationId, service/positions, date, start, end, barberId }`
- `apps/web/src/app/booking/**` and `apps/mobile/src/lib/api/booking.ts` — import the contract type
  instead of local duplicates
- `docs/booking-flow.md` §Screen 1 — positions instead of a single service, with the 3-position cap

Testable Done:
- Contract type is consumed by web and mobile with no local re-declaration; `packages/contracts`
  tests pass.
- `pnpm docs:validate` reports no new errors against the current baseline.
- End-to-end booking test with two positions returns a `201` whose payload round-trips through the
  contract type (compile-time check in the test file).

Check: `pnpm --filter @fade/contracts test && pnpm docs:validate`

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
