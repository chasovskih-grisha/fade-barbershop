# T-4447 · Barber leave (vacation/sick leave)

- **Stage**: M3 (phase 7) · **Tags**: backend, barber-app, hr · **Complexity**: middle · **Depends on**: T-083, T-082, T-042
- **StoryPoints**: 5

## What

The `onLeave` status for a barber with a period: they disappear from available slot selection, block the creation of new bookings, reschedule/cancel existing ones within the period (T-4414 patterns, with client notifications), and show up in the admin calendar. Controlled from the barber app and admin panel; leave does not break the weekly schedule (T-4415).

## Why

A master's vacation without special status = slots are sold in their absence. Leave is the most frequent manual entry in CLT-01.

## Sources

- barber-screens.md; scheduling README; T-083, T-082 (barber surfaces), T-042 (state change)

## Done

- [ ] `onLeave` in schedule/selection; new bookings are blocked, existing ones are rescheduled/cancelled with notification
- [ ] Return without manual cleanup (return event)
- [ ] Test: week-long leave with 3 bookings

## Risks

- [ ] **Rescheduling burden on Monday**: rescheduling with a period without client confirmation — T-4416 flow (booking management link)
