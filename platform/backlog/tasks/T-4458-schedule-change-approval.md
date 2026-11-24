# T-4458 · Schedule change approval (per location)

- **Stage**: M4 (phase 8) · **Tags**: backend, scheduling, ux · **Complexity**: middle · **Depends on**: T-230
- **StoryPoints**: 5

## What

In the T-230 flow (client requests a new time) — operator side: confirmation/rejection for early requests (T-4415) — notification to the client with the new time and confirmation, without stopping slot generation. Upon agreement — appointment change (T-042); upon rejection — alternative queue (T-4453 link).

## Why

The schedule changes faster than client requests; the operator-approved option is the main conflict in T-230 today.

## Sources

- booking-flow.md; scheduling README; T-230 (appointment change), T-4415 (schedule), T-042

## Done

- [x] Change request → operator confirms/rejects (with alternative)
- [x] Client agreement is recorded as a new event (idempotent)
- [x] Test schedule and booking window conflicts

## Risks

- [x] **Schedule change during approval**: a new booking arrives for a cancelled state — serial execution + slot identifier validation

## Current Slice (2026-11-24)

Requests persist in `ScheduleChangeRequest`; approval checks the 60-day window
and live slot availability, rejection keeps an optional alternative. Client
agreement is claimed with one conditional update (`agreementEventId` unique), so
a retry with the same event id emits no second event or reschedule. The winning
agreement applies the move through `RescheduleAppointment` (T-042) inside the
same transaction; schedule/OpeningHours/booking conflicts roll the agreement
back. HTTP: `POST /schedule/change-requests`, `POST /schedule/change-requests/:id/confirm`,
`GET/POST /admin/schedule/change-requests` and `…/:id/approve|reject`.
