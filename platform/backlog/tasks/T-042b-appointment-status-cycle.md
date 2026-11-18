# T-042b · Full Appointment status cycle (3/10)

- **Stage**: M1 (phase 4) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-042a
- **StoryPoints**: 3

## What

ADT transition model `booked → confirmed → in_progress → completed` (+ no_show/cancelled): disallowed transitions blocked by types; statuses do not roll back; rescheduling and cancellation by client/admin, not barber.

## Why

Slice 2/3 of parent T-042 — mechanical work per `scheduling` README when ADT model is agreed.

## Sources

- scheduling README (lifecycle)
- PAY-004 (billing synchronization point)

## Done

- [x] Disallowed transitions blocked by types (ADT), not just runtime check
- [x] Statuses do not roll back; Tests for every forbidden transition
- [x] Barber cancellation blocked at use case level

## dependencies

- T-042c (idempotent reference handler)

## Current slice (2026-09-25)

ADT model in `domain/appointment.transitions.ts`: `AppointmentStatus` type (literal union) + `TRANSITIONS` (allowed transitions table) + `InvalidTransitionError`; aggregate stores status as typed union, so invalid state is indistinguishable by types. Unit spec `appointment.aggregate.spec.ts` covers **every** forbidden transition (confirmed→completed bypassing in_progress, terminality of completed/cancelled/no_show, booked bypassing confirm) — status does not change on throw. Barber cancellation/rescheduling blocked in `AppointmentLifecycle` («Barber cannot cancel/reschedule»), Tests in `appointment-lifecycle.use-case.spec.ts`.
