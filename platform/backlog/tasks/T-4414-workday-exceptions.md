# T-4414 · Special Dates and Temporary Location Closures

- **Stage**: M1 (phase 4) · **Tags**: backend, high-risk · **Complexity**: senior · **Depends on**: T-021, T-022, T-040
- **StoryPoints**: 8

## What

Exceptional working hours: model `WorkdayException` (local period: date, hours or closed, reason, `createdBy`), priority over regular schedule, slot overlapping for exceptions (slots not sold), rescheduling policy for existing bookings when a day is cancelled (notifications to clients + reschedule option), view in admin calendar with color coding.

## Why

Holidays, sanitization, team training, chair repair — typical real events; without exceptions in the model, they have to be combined "manually" by disabling the location (T-021), which stays silent to clients and breaks already created bookings.

## Sources

- scheduling README; admin-screens.md §5 (calendar); web-screens; booking-flow (disabled — without cards)

## Done

- [ ] `WorkdayException` with overlap validation and tests
- [ ] Slots for exceptional days are not generated; bookings for closed days are in "reschedule?" status
- [ ] Client notifications and admin reason view work

## Audit 2026-11-24

Reopened. Only the pure domain (`workday-exception.ts` and its spec) exists.
There is no Prisma model or migration, no slot/booking integration, no
“reschedule?” handling for existing visits, and no admin reason/notification
surface. The checked-in QA command covers the domain spec only, not this task.

## Reopening slices (2026-11-25)

Order: S1 → S2 → S3. The Done checkboxes stay open until all three slices land; each slice
is independently shippable and testable.

### S1 · Persist the exception and expose it to admins

Files:
- `apps/api/prisma/schema.prisma` — `model WorkdayException` (`id`, `locationId`, `date @db.Date`,
  `closed`, `open`, `close`, `reason`, `createdBy`, timestamps, `@@unique([locationId, date])`)
- `apps/api/prisma/migrations/<ts>_add_workday_exception/`
- `apps/api/src/scheduling/infrastructure/prisma-workday-exception.repository.ts` (new) — maps
  rows through `createWorkdayException` from `domain/workday-exception.ts`
- `apps/api/src/scheduling/infrastructure/admin-workday-exceptions.controller.ts` (new) —
  `GET /admin/locations/:locationId/workday-exceptions?from=&to=`, `POST` (create/update),
  `DELETE /:id`

Testable Done:
- Second exception for the same `locationId` + `date` returns **409** and the first row is unchanged
  (`admin-workday-exceptions.controller.spec.ts`), driven by `hasWorkdayExceptionOverlap`.
- Invalid date, empty reason, `open >= close` return **400** with the domain message; a `closed`
  exception persists `open`/`close` as `null`.
- Round-trip: create → reload from Prisma → `effectiveDayWindow` returns `null` for `closed` and the
  exception hours for a custom window.
- `prisma migrate deploy` applies the migration on an empty test database.

Check: `pnpm --filter @fade/api exec jest src/scheduling/infrastructure/admin-workday-exceptions.controller.spec.ts src/scheduling/domain/workday-exception.spec.ts`

### S2 · Slots and booking creation honour the exception

Files:
- `apps/api/src/booking/infrastructure/available-slots.ts` + `available-slots-helpers.ts` +
  `available-slots.provider.ts` — inject the exception repository, load the row for
  `locationId` + requested `date`, and replace `dayWindow(...)` with `effectiveDayWindow(...)`
  from `domain/workday-exception.ts`
- `apps/api/src/scheduling/application/book-appointment.use-case.ts` — reject a closed date before
  slot validation (domain error, mapped to 409 by the controller)

Testable Done:
- `POST /booking/slots` for a closed date returns `[]` (not a grid with disabled rows) and does not
  call the barber schedule repositories.
- On a custom-hours date, every returned slot satisfies `open <= start` and `end <= close`; a slot
  outside the window that exists on a normal week is absent.
- `POST /booking/bookings` on a closed date returns 409 and writes no `Booking` or outbox row
  (`booking-flow-gwt.e2e.spec.ts` + a focused use-case spec).
- An exception for another location or another date leaves the response byte-identical.

Check: `pnpm --filter @fade/api exec jest src/booking/infrastructure/available-slots src/scheduling/application/book-appointment`

### S3 · Existing visits, admin calendar and client notice

Files:
- `apps/api/src/scheduling/domain/appointment.transitions.ts` — add `reschedule_required` to
  `AppointmentStatus`/`TRANSITIONS` (only from `booked`/`confirmed`; reschedule back to `confirmed`)
- `apps/api/prisma/schema.prisma` — `status` accepts the new value; migration for any status check
- `apps/api/src/scheduling/application/close-workday.service.ts` (new) — one transaction: create the
  exception, find overlapping live appointments, set `reschedule_required`, emit
  `scheduling.appointment.reschedule_required`, enqueue the existing
  `notifications/application/appointment-reschedule-template.ts` message
- `apps/api/src/scheduling/application/admin-calendar.ts` / `admin-calendar.view.ts` — exception rows
  with reason and `closed` flag
- `apps/admin/src/app/calendar/**` — render the exception marker and reason

Testable Done:
- Closing a date with two live visits returns `{ affected: 2 }`; both appointment rows become
  `reschedule_required` and two outbox events of the new type exist — no booking is silently deleted.
- Rescheduling one of them to an open slot returns `confirmed`, clears `reschedule_required`, and the
  original slot is free again.
- A `NotificationRecord` row exists per affected visit with the reason in the payload.
- `GET` admin calendar for that month includes the exception with `closed`/hours and reason, and the
  admin card shows the same reason text (component test).
- Transitions spec rejects `completed → reschedule_required` and allows
  `reschedule_required → confirmed | cancelled`.

Check: `pnpm --filter @fade/api exec jest src/scheduling/application/close-workday.service.spec.ts src/scheduling/application/admin-calendar.spec.ts src/scheduling/domain/appointment`

## Risks

- [ ] **Loss of bookings**: rescheduling without confirmation = lost client — re-booking slot confirmation flow is mandatory (link with T-170/events)

## Implementation plan

Paths:
- apps/api/src/scheduling/domain/workday-exception.ts

Checks:
- pnpm --filter api test apps/api/src/scheduling/domain/workday-exception.spec.ts

## Implementation notes

- apps/api/src/scheduling/domain/workday-exception.spec.ts
- apps/api/src/scheduling/domain/workday-exception.ts

## QA

- `pnpm --filter api test apps/api/src/scheduling/domain/workday-exception.spec.ts` exit 0
