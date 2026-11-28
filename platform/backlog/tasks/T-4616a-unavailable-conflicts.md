# T-4616a · Barber unavailability and conflict resolution per visit

- **Stage**: M2 (phase 7) · **Tags**: backend, scheduling · **Complexity**: senior · **Depends on**: T-042, T-4533
- **StoryPoints**: 8
- **Policy**: [ADR 0056](../../docs/adr/0056-barber-unavailability-conflicts.md)

## What

Add barber unavailability mark and conflict resolution command in `scheduling`.

- `MarkBarberUnavailable` accepts a barber and an interval. Future visits of this barber intersecting the interval become conflicts. Past and already completed visits are not affected. The mark does not trigger `Cancel` or `Reschedule`.
- While a conflict is open, new bookings for this barber within the interval cannot be created. Another barber at the same location works as usual.
- `ResolveConflict` for a single visit: either reassign to a specific barber and a new slot (same window and chair validation as regular rescheduling), or cancel with reason "barber unavailable". Upon success, the conflict is closed.
- Outbox event is singular per visit. Repeating the same command does not send a second message and does not move the visit a second time.
- The list of open conflicts is queried separately: visit, client, service, time, whether another barber with this service is available.

Planned leave (T-4447) is a producer of the **same** `MarkBarberUnavailable` command and the same conflict rows. A `DayOff`/leave interval does not get its own resolution path, and this slice must not add an automatic reschedule or mass cancel.

## Why

Without a dedicated "conflict" state, the calendar either silently keeps bookings for an absent person or wipes out the day entirely. The founder needs a list, not surprises.

## Sources

- T-4616; T-4533 (rescheduling preserves client and service)
- ADR 0009; ADR 0019
- `docs/ubiquitous-language.md` (UnavailableDay)

## Done

- [ ] Interval marking does not change status of existing visits
- [ ] Planned leave from T-4447 creates the same conflicts and changes no visit
- [ ] New bookings in this interval for this barber are rejected
- [ ] Reassignment to a barber who does not perform the service is rejected
- [ ] Repeating `ResolveConflict` for a closed conflict changes nothing
- [ ] Tests: day with three visits, resolution differs, one failure does not roll back others

## Risks

- [ ] **Father-son party**: If one leg of a party is unavailable, the conflict is single per party, not two independent visits. This slice does not silently reassign the second leg.
- [ ] **Location time zone**: The interval is the location's local day, not the server's UTC day.

## Delimitation

- Screens and client text — **T-4616b**
- Permission to press — founder. Separate admin roles — **T-2400**

## Implementation plan

- apps/api/src/scheduling/domain/barber-unavailability.ts
- apps/api/src/scheduling/domain/shift-conflict-ports.ts
- apps/api/src/scheduling/application/mark-barber-unavailable.use-case.ts
- apps/api/src/scheduling/application/list-shift-conflicts.use-case.ts
- apps/api/src/scheduling/application/shift-conflict-availability.ts
- apps/api/src/scheduling/application/resolve-shift-conflict.use-case.ts
- apps/api/src/scheduling/application/barber-unavailability.spec.ts
- apps/api/src/scheduling/application/resolve-shift-conflict.spec.ts
- apps/api/src/scheduling/application/book-appointment-unavailability.spec.ts
- apps/api/src/scheduling/infrastructure/prisma-barber-unavailability.repository.ts
- apps/api/src/scheduling/infrastructure/prisma-shift-conflict.repository.ts
- apps/api/src/scheduling/infrastructure/admin-barber-unavailability.controller.ts

Checks:

- `cd apps/api && npx jest ../apps/api/src/scheduling/application/barber-unavailability.spec.ts ../apps/api/src/scheduling/application/resolve-shift-conflict.spec.ts ../apps/api/src/scheduling/application/book-appointment-unavailability.spec.ts ../apps/api/src/scheduling/application/reschedule-appointment.use-case.spec.ts ../apps/api/src/scheduling/infrastructure/prisma-appointment-time-mover.persist.spec.ts --runInBand`
- `cd apps/api && npx eslint src/scheduling/domain/barber-unavailability.ts src/scheduling/domain/shift-conflict-ports.ts src/scheduling/application/mark-barber-unavailable.use-case.ts src/scheduling/application/list-shift-conflicts.use-case.ts src/scheduling/application/shift-conflict-availability.ts src/scheduling/application/resolve-shift-conflict.use-case.ts src/scheduling/infrastructure/prisma-barber-unavailability.repository.ts src/scheduling/infrastructure/prisma-shift-conflict.repository.ts src/scheduling/infrastructure/admin-barber-unavailability.controller.ts`
