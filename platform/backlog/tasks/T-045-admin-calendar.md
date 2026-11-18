# T-045 · Network Calendar in Admin Panel

- **Stage**: M1 (phase 4) · **Tags**: frontend · **Complexity**: middle · **Depends on**: T-042
- **StoryPoints**: 5

## What

`admin-screens.md` §5: day/week view by locations/barbers, visit card (reference, comment, statuses, confirm/reschedule/cancel), filters. Rescheduling uses the same slot validator; actions are logged.

## Sources

- `MNG-ADM-15`, `REF-ADM-01…04`; `admin-screens.md` §5 (including on-site payment §5.2 — phase 8 gate)

## Done

- [x] Calendar shows network visits with references (backend read-API done 2026-09-26: `GET /admin/calendar`; web-UI grid + toolbar done 2026-09-26)
- [x] Admin rescheduling/cancellation work according to lifecycle rules (commands — T-042/T-043/T-4533; UI action panel — VisitCard, done 2026-09-26)
- [x] Calendar and dashboard update via live SSE stream through outbox relay: new/updated visit appears without page reload (client `EventSource('/admin/live/events')` → re-reads day; signal without personal data). Relay reads outbox rows of live grid types after watermark and publishes to `AdminLiveFeed` (SSE `200 text/event-stream`, event name `appointment`, body `{type,appointmentId}`). Auto-start disabled in tests (NODE_ENV=test). Gates: api tsc/lint/jest 5 suites/11 tests + http spec on real SSE stream; admin tsc/eslint 0 errors, jest 109/109; prettier clean.

Outside this task: drag&drop rescheduling — T-4524a; waitlist hatching — T-170; on-site payment — phase 8.

## Current Slice (2026-09-26, GWT e2e + coverage gate)

- **GWT e2e grid** (`admin-calendar.e2e.spec.ts`, 5 scenarios, Gherkin naming per `booking-flow-tests.md`): (1) admin opens day — visit with reference and comment (REF-ADM-01); (2) filters with/without split the grid, confirmed status is visible (REF-ADM-02); (3) Monday-first week — Sunday rolls back to Monday (MNG-ADM-15); (4) ∅ empty day by filter of another barber + 400 on malformed dates; (5) **command binding to read** — cancel via `POST /admin/appointments/:id/cancel` is immediately visible in grid with `cancelled` status (UI action card data and read-API share a single Booking row).
- **Read-model coverage**: `admin-calendar.ts` — 100% stmts/lines/funcs, 96.29% branch (line 48 — documented istanbul instrumentation artifact on parameter-property constructor: phantom branch "call without argument", unachievable in any constructor style; ≥90 Done gate). `service-preparation.ts` — 100/100 (new unit spec: default-duration branches, inactive service/price 404, parallel duration and 400, dayOfWeekFor Mon/Sun).
- **Found and closed silent regression gate from T-041**: since adding shared `prepareService`, full run with `--coverage` exited with code 1 (branch 61.53% < 90 application threshold), although all tests were green — previous sessions checked only total test line. Now `EXIT=0` with coverage: suite 493/493 (103 suites) ×2 in a row.

## Current Slice (2026-09-26, web-UI: grid + action card)

- `apps/admin/src/app/calendar/` — grid connected to read-API: `CalendarToolbar` (view day/week, date, location, barber, reference with/without — REF-ADM-02, "Update"), `VisitsTable` (time, status `StatusPill`, barber/location from `/admin/locations`·`/admin/barbers` dictionaries, price, reference "yes" marker; row click → card), `useAdminCalendar` (auth guard `/admin/auth/me` → actor, dictionaries, reload by filters), EmptyState ∅.
- `VisitCard` — action panel over lifecycle commands (T-042/T-043/T-4533): confirm/start/complete/no-show/cancel by status (`NEXT_ACTIONS` map mirrors `AppointmentLifecycle`), "Reschedule" (`RescheduleForm`: date + HH:mm → `/reschedule`, 409 → "Slot is busy"), comment ≤500 while booked/confirmed (T-043; `ReferenceLockedError` → 409 shown as error), terminal statuses — no actions. Actor — admin ID from `/admin/auth/me` (`actorRole: 'admin'`).
- Composition per LOC/complexity gate (100 lines/10): `visit-status` (types + action map), `useVisitCommand` (POST + busy/error), `VisitActions`, `RescheduleForm`, `VisitsTable`, `CalendarToolbar`. Tests: 10 (grid + refetch on filters, card opening, confirm POST with actor, 409 mapping, status gates, reschedule form, comment) — admin suite 30/30, tsc/lint clean.
- Remaining: drag&drop rescheduling (T-4524a), waitlist hatching (T-170), on-site payment §5.2 (phase 8), loyalty/parties in UI, creating booking from calendar ("Add booking" — separate slice over POST /admin/bookings).

## Previous Slice (2026-09-26, backend read-API)

- `AdminCalendar` (`scheduling/application/admin-calendar.ts`) + `GET /admin/calendar` (`infrastructure/admin-calendar.controller.ts`): day window `[00:00,+1d)` or Monday-first week window `[monday,+7d)` — any day of the week normalizes to Monday (Sunday inclusive); filters `locationId`/`barberId`/`reference=with|without|all` (REF-ADM-02) in a single Prisma where; response — visits with `id` = `appointmentId ?? bookingId` (cell click → visit card), status (fallback `booked`), `haircutReferenceId` ("has reference" marker), comment, party (`partyId/partyRole`), price. Malformed dates → 400 (`InvalidSlotError`). Read-side BookingReader style: Prisma directly, without domain port — Appointment status lives on Booking row, Booking aggregate does not carry it.
- Data for visit card already exists on backend: reference/comment — T-043, rescheduling — T-4533, lifecycle commands — T-042 (all via `POST /admin/appointments/:id/*`).
- Coverage: unit (day/week/Sunday windows, where filters, fallback mapping, 400) + e2e (day with location filter, with/without + confirmed, Sunday week, empty day, 400). Full suite 467/467.
- Remaining: web-UI grid/toolbar (T-045 front), waitlist hold hatching (T-170), on-site payment (§5.2 — phase 8), loyalty/parties in UI.

## Risks

- [x] **Migrations**: schema changes break existing data — migration with backfill plan (read-only over existing tables; no migrations)
- [x] **Domain events**: subscriptions are idempotent (pattern ADR 0009/0016) (read-model without events)
