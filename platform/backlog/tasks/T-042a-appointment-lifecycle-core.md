# T-042a · Appointment Lifecycle (Core) (4/10)

- **Stage**: M1 (phase 4) · **Tags**: backend, high-risk · **Complexity**: middle · **Depends on**: T-040
- **StoryPoints**: 4

## What
`Appointment` aggregate and states `booked → confirmed → in_progress → completed` (+ no_show/cancelled). Events `AppointmentBooked/Confirmed/Rescheduled/Cancelled/Completed/NoShowed` via outbox. Rescheduling and cancellation by client/admin (not barber). Statuses do not roll back.

## Why
Outbox — infrastructure for all future subscribers (loyalty, reviews, waitlist, analytics). Most important core for M1.

## Sources
- scheduling README (lifecycle, events)
- ADR 0009/0016 (idempotent subscribers)

## Done
- [x] Aggregate and states implemented
- [x] Events via outbox

## dependencies
- T-042b (outbox infrastructure)

## Current Slice (2026-09-25)

`Appointment` aggregate (`domain/appointment.aggregate.ts`) with public `data` state and `pullEvents()`; ADT transitions in `domain/appointment.transitions.ts` (types + runtime table `TRANSITIONS`, `InvalidTransitionError`); 7 `scheduling.appointment.*` events in `domain/appointment.events.ts`. State lives on the Booking row (`appointmentId/status/cancelReason`, migration `20261102010000_appointment_status`) — lifecycle cannot diverge from slot; events are written to outbox in the same transaction (`PrismaAppointmentRepository`, unit of work). Upon booking, the aggregate is created by helper `appoint()` (`application/appointment-spawn.ts`) in the same book use case transaction. Commands — `AppointmentLifecycle` (`confirm/start/complete/markNoShow/reschedule/cancel`), REST — `AdminAppointmentsController` (404/409/400). Tests: aggregate and use case unit tests + e2e `appointment-lifecycle.e2e.spec.ts`.
