# T-042 · Appointment Lifecycle and Events (outbox)

- **Stage**: M1 (phase 4) · **Tags**: backend · **Complexity**: senior · **Depends on**: T-040
- **StoryPoints**: 10

## What

Aggregate `Appointment` and states `booked → confirmed → in_progress → completed` (+ no_show/cancelled); events `AppointmentBooked/Confirmed/Rescheduled/Cancelled/Completed/NoShowed` via **outbox** (at-least-once, idempotent handlers). Rescheduling and cancellation are done by client/admin (not barber); statuses do not roll back.

## Why

Outbox is the infrastructure for all future subscribers (loyalty, reviews, waitlist, analytics).

## Sources

- scheduling README (lifecycle, events, synchronization points with PAY-004)
- ADR 0009/0016 (idempotent subscription pattern — verified by this task)

## Done

- [x] Events go through outbox; redelivery does not duplicate effects
- [x] Lifecycle matches README (Tests)



## Risks

- [x] **Status machine**: unauthorized transitions must be blocked by types (ADT) — implement no later than slice 2, otherwise statuses roll back
- [x] **Event idempotency**: outbox redelivery must not duplicate effects — risk across all Slice 1 and 3
- [x] **Outbox infrastructure risk**: relay without lag monitoring — events "go", but no one notices the queue

## Current Slice (2026-09-25)

Implemented all 3 slices (see T-042a/b/c, all `done`). Mechanism: `Appointment` aggregate with states `booked → confirmed → in_progress → completed` (+ no_show/cancelled) on ADT transition table (`appointment.transitions.ts`); commands (`confirm/start/complete/markNoShow/reschedule/cancel`) — `AppointmentLifecycle`, cancel/reschedule forbidden for barbers; events `scheduling.appointment.*` written to `OutboxMessage` in the same unit of work transaction as state (atlas adapter `PrismaAppointmentRepository` holds state on Booking row). Redelivery does not duplicate effects — reference subscriber `AppointmentActivityProjection` (T-042c). Documented in `apps/api/src/scheduling/README.md` (section "Appointment Lifecycle - Implementation"), e2e — `scheduling/e2e/appointment-lifecycle.e2e.spec.ts`.

## Breakdown (slices, M1 critical path)

1. **Outbox-infrastructure** *(senior)* — table, relay, at-least-once; on `AppointmentBooked`/`AppointmentCancelled` events. Riskiest Slice: transport decisions (LISTEN/NOTIFY vs polling), retries, and delivery order — everything further in the backlog (loyalty, reviews, waitlist, analytics) builds on this pattern.
2. **Full status cycle** *(middle)* — ADT transitions + bans (no rollbacks; cancellation not by barber). After slice 1 — mechanical work following README.
3. **Idempotent reference handler** *(senior)* — single subscriber with processed log (ADR 0009 pattern), copied by loyalty/reviews/waitlist/analytics. Senior because it is a template for ~6 future subscribers.

Slice 1 — infrastructural and riskiest: start first, test with artificial red delivery. Slice 2 — in parallel (another person) once ADT state model is agreed upon.
