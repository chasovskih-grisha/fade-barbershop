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
