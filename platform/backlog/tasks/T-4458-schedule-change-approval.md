# T-4458 · Schedule change approval (per location)

- **Stage**: M4 (phase 8) · **Tags**: backend, scheduling, ux · **Complexity**: middle · **Depends on**: T-230
- **StoryPoints**: 5
- **Status**: review

## What

In the T-230 flow (client requests a new time) — operator side: confirmation/rejection for early requests (T-4415) — notification to the client with the new time and confirmation, without stopping slot generation. Upon agreement — appointment change (T-042); upon rejection — alternative queue (T-4453 link).

## Why

The schedule changes faster than client requests; the operator-approved option is the main conflict in T-230 today.

## Sources

- booking-flow.md; scheduling README; T-230 (appointment change), T-4415 (schedule), T-042

## Done

- [x] Change request → operator confirms/rejects (with alternative): `domain/schedule-change-request.ts` (requested → approved with a hold / rejected with reason + optional alternative), `application/schedule-change-approval.service.ts`, `infrastructure/schedule-change.controller.ts` (`POST schedule/change-requests`, `GET schedule/change-requests/:id`, `POST .../:id/confirm`, `GET admin/schedule/change-requests`, `POST admin/schedule/change-requests/:id/approve|reject`)
- [x] Client agreement is recorded as a new event (idempotent): `confirmAgreement` dedupes by `eventId`, retry returns `alreadyConfirmed: true` and emits exactly one event through the `ScheduleChangeEvents` outbox port
- [x] Test schedule and booking window conflicts: 15 tests cover slot-shape validation, proposal window (`PROPOSAL_WINDOW_MINUTES = 120`) expiry, hold expiry, occupied slot at approve/confirm, foreign client, double decision and outbox failure
- [x] Slot availability checked at approval *and* at confirmation via `ScheduleChangeAvailability` (booking-overlap adapter `PrismaScheduleChangeAvailability`) so a booking arriving between the two steps is refused, not overwritten

## Risks

- [x] **Schedule change during approval**: a new booking arrives for a cancelled state — serial execution + slot identifier validation
- [x] Deterministic clock (`SCHEDULE_CHANGE_CLOCK`) injected for hold/expiry; no wall-clock reads in tests

## Deferred

- Prisma persistence for change requests: no `ScheduleChangeRequest` table in `prisma/schema.prisma` yet, so the `ScheduleChangeRepository` port runs on `InMemoryScheduleChangeRepository` (same precedent as T-4559/T-4461).
- Durable outbox: `RecordingScheduleChangeEvents` keeps events in memory that dedupe by `eventId`; a Prisma/queue adapter replaces the single provider once persistence lands.
- Actual appointment move (T-042) and booking-window policy from per-location settings: slot is validated structurally and against the booking window (60 days) here; the reschedule use case still performs the move.
- Client notification with the new time (T-4555) and admin UI — separate cards.
