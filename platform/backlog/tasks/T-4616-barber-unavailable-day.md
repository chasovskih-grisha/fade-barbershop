# T-4616 · Barber unable to work on a day with existing bookings

- **Stage**: M2 (phase 7) · **Tags**: backend, frontend, scheduling · **Complexity**: senior · **Depends on**: T-042, T-4533, T-080
- **StoryPoints**: 16

## What

Closing a day when a barber is no longer working without leaving clients in the dark or cancelling them all in one mass sweep.

Currently, the schedule describes when a barber accepts new bookings. It does not answer the question "what to do with eight people already booked for tomorrow if the barber falls ill." The priority queue (T-4574) mentions such a case in a single rule. The HR vacation list (T-4547) does not move visits either.

A single operational workflow is needed:

1. The barber or founder marks an interval of unavailability. Future visits of this barber within the interval become conflicts. They are not automatically cancelled or rescheduled.
2. For each conflict, the founder chooses: reschedule to another barber who performs this service and has an opening, or cancel. The client receives a single notification with the outcome.
3. The chair is freed only after a decision is made, not at the moment of marking.

Barbers do not reschedule other people's visits themselves. They only report that they won't be able to work. The decision regarding people remains with the founder (the same rule as in schedule self-service, phase 22).

## Why

Two chairs and one sick barber means half a day's salon capacity. Without a conflict list, the founder compiles it from the calendar manually, and the client finds out at the door.

## Sources

- `docs/roadmap.md` phase 22 (barber does not reschedule clients themselves; admin decides)
- ADR 0009 (event per visit, retry does not create a second reschedule)
- T-042 (lifecycle), T-4533 (reschedule), T-080 (notification channel)
- T-4521 (which barbers actually perform the service)

## Done

- [ ] Slices a and b in status `done`
- [ ] No visit changes status simply because a barber is marked unavailable
- [ ] The client receives no more than one notification per decision

## Risks

- [ ] **Single transaction for the entire day.** Forbidden. One visit — one transaction. Otherwise, a failure on the fifth client will roll back already notified ones
- [ ] **Deposit.** Cancellation follows the current refund rule. This Epic does not invent "barber illness = always refund" and does not block this rule if it already exists in payment
- [ ] **Second barber cannot perform the service.** Such a reschedule option is not offered

## Out of scope

- HR vacations and sick leave tracking — **T-4547**
- Priority queue marker — **T-4574**. It can reference here once the conflict list exists
- Standalone barber schedule editor — phase 22
- No-show policy — phase 16
