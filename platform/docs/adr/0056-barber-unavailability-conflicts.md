# 0056 · Barber unavailability creates conflicts, never automatic reschedules

- **Status**: accepted
- **Date**: 2026-11-24

## Context

Two tickets described what happens to already-booked visits when a barber stops working:

- **T-4447** (planned vacation/sick leave) said existing visits are rescheduled or cancelled automatically within the leave period.
- **T-4616** (barber cannot work on a day with bookings) said marking unavailability must not change any visit; it opens one conflict per visit and the founder decides each one.

Both tickets touch the same visits and the same client notification. Keeping both rules would mean planned leave silently moves clients while an unplanned sick day waits for a decision — the same operational event with two different outcomes. This ADR fixes one policy before either ticket is implemented.

## Decision

One policy applies to **every** barber unavailability: planned vacation, sick leave, a one-day absence, or a temporary interval.

1. **One source fact.** A planned leave (`DayOff`) and an ad-hoc interval are both producers of an `UnavailableDay` / `BarberUnavailability`. There is no separate `onLeave` presence status and no second cancellation workflow. T-4447 supplies the planned-leave input; T-4616 owns the conflict engine.
2. **Marking is immediate and neutral.** Saving the interval blocks new bookings and slot selection for that barber inside it. It does not change the status, time, barber, price, deposit or refund state of any existing visit. The mark is never rejected because visits already exist.
3. **Every actionable existing visit opens one conflict.** One open `ShiftConflict` per visit (one per party, not one per leg) until an explicit decision closes it. Completed, cancelled and no-show visits are not opened again.
4. **The founder decides per visit.** Resolution is either:
   - reassign to a qualified barber with a valid slot, using the normal reschedule validation; or
   - cancel with reason `barber unavailable`.
   Each visit is its own transaction. There is no all-day transaction and no automatic “reschedule everyone” button. Repeating a decision for a closed conflict changes nothing.
5. **The barber reports, the founder resolves.** A barber may mark their own unavailability and see the waiting conflicts. A barber may not reschedule or cancel another person's visit.
6. **One notification per decision.** After a successful resolution the client receives exactly one message: the new time and barber, or the cancellation and how to book again. The text never mentions illness or another medical detail. A failed delivery does not reopen or block the conflict; the visit is already changed and delivery retries like any other notification.
7. **Money follows the existing rule.** Cancellation uses the current deposit/refund policy (PAY-005…010). “Barber unavailable” is not a special always-refund reason.
8. **Return does not clean up silently.** Ending leave restores the weekly schedule; unresolved conflicts remain in the founder's queue until decided.

## Consequences

- T-4616 is the owner of `MarkBarberUnavailable`, `ShiftConflict` and per-visit resolution.
- T-4447 depends on T-4616a/T-4616b and only adds planned-leave entry, approval/visibility and calendar integration. It must not add an automatic reschedule or mass-cancel path.
- The conflict list, resolution actions and client message are shared: T-4447 does not get its own text or resolution screen.
- SCH-004 and the phase-22 roadmap wording are aligned to this ADR: the interval is applied immediately; existing visits stay untouched and open conflicts.
- Tests must cover a leave/week with three visits: all three become conflicts, none moves before a decision, and each resolution produces at most one notification.
