---
id: T-6010
title: "Defect: T-4418 unit test failure on pnpm --filter api test:unit"
status: todo
sp: 2
priority: medium
category: qa, backend
phase: 1
milestone: M1
source: "agent-gate qa failure on T-4418"
---

# T-6010 · Defect: T-4418 unit test failure on pnpm --filter api test:unit

- **Stage**: M1 · **Tags**: qa, backend · **Complexity**: junior · **Depends on**: T-4418
- **StoryPoints**: 2

## What

Task T-4418 in review failed `pnpm --filter api test:unit` during QA check.

## Implementation plan

Checks:
- `pnpm --filter api test:unit`

## Implementation notes

- 2026-11-25: `BookingModule` did not register `PrismaBarberUnavailabilityRepository`, so
  `CLIENT_BOOKINGS_IO` could not resolve its tenth dependency and `booking.module.spec.ts`
  failed. The adapter is now a provider of `BookingModule`; that suite passes.
- Still red in the same suite (outside this task's fix): `t-174-batch-slot-selection.spec.ts`
  and `payment.controller.spec.ts`. Task stays `in_progress`.
