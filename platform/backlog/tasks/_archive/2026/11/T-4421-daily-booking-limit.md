# T-4421 · Daily workload limit

- **Stage**: M1 (phase 4) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-040
- **StoryPoints**: 3

## What

The `MaxBookingsPerDay` rule (barber or chair): config limit on the maximum number of bookings per day; upon attempting to Create a booking exceeding the limit — block and explanation; report on overloaded barbers for the admin panel. The limit is set in location settings.

## Why

The 8:00-20:00 schedule generates 40 slots, but a barber can handle 12 haircuts; without a limit, execution quality drops and CLT-01 gets an "overheated" day.

## Sources

- scheduling README; admin-screens.md (location settings); booking-flow (block: where to show the reason)

## Done

- [ ] Limit in settings; validation upon booking creation
- [ ] Client notification contains a list of available dates
- [ ] "Overload" report available to admin

## Risks

- [ ] **Task does not cover walk-ins**: the daily counter counts walk-ins separately — decision recorded in ADR 0012
- [ ] Booking rescheduling (T-4414/4420) does not count towards the limit again (test)
