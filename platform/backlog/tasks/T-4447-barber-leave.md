# T-4447 · Barber leave (vacation/sick leave)

- **Stage**: M3 (phase 7) · **Tags**: backend, barber-app, hr · **Complexity**: middle · **Depends on**: T-4616a, T-4616b, T-082, T-083
- **StoryPoints**: 5
- **Policy**: [ADR 0056](../../docs/adr/0056-barber-unavailability-conflicts.md)

## What

Planned leave (vacation or sick leave) is an **input into the T-4616 unavailability flow**, not a second way to move visits.

A `DayOff` for a barber becomes an `UnavailableDay` interval. Inside that interval the barber disappears from available slot selection, new bookings are blocked, and every actionable existing visit opens one `ShiftConflict`. The mark itself never reschedules or cancels a visit. The founder resolves each conflict through the T-4616b screen: reassign to a qualified barber with a valid slot, or cancel with reason “barber unavailable”. The client receives one message per decision.

Leave is controlled from the barber app and admin panel, shows in the admin calendar, and does not break the weekly schedule (`Availability`). Ending leave restores the weekly schedule but does not silently close unresolved conflicts. Approval and HR vacation tracking remain in T-4547.

## Why

A master's vacation without a special interval = slots are sold in their absence. Leave is the most frequent manual entry in CLT-01. It must use the same conflict queue as a sick day, otherwise planned leave would silently move clients while an unplanned absence waits for the founder.

## Sources

- ADR 0056; T-4616, T-4616a, T-4616b
- barber-screens.md; scheduling README; phase-22 roadmap
- T-083, T-082 (barber surfaces), T-042 (state change)

## Relationship with T-4616

- **T-4616 owns the engine**: `MarkBarberUnavailable`, `ShiftConflict`, per-visit `ResolveConflict`.
- **T-4447 owns planned leave**: the `DayOff` entry/approval, visibility in the barber app and admin calendar, and the return event.
- T-4447 must call the same mark command and show the same conflict list/notification. It must **not** add an automatic reschedule, a mass cancel, or its own client text.
- If T-4616a/T-4616b are not available, T-4447 stays `todo`; it is not implemented against a second policy.

## Done

- [ ] A leave interval creates an `UnavailableDay`; the barber is absent from slot selection and new bookings inside it are rejected
- [ ] Existing visits become one open conflict each; none changes status, time or barber at marking time
- [ ] The founder resolves each conflict through T-4616b: reassignment uses normal slot/chair/service qualification; cancellation uses reason “barber unavailable”
- [ ] One client notification per decision; no medical detail; failed delivery does not reopen the conflict
- [ ] Return restores the weekly schedule without auto-closing unresolved conflicts
- [ ] Admin calendar shows the leave interval and its open conflicts
- [ ] Test: week-long leave with 3 bookings → 3 conflicts, 0 visits moved before decisions, 3 independent resolutions

## Risks

- [ ] **Monday backlog**: planned leave can create a queue of conflicts. The answer is the shared T-4616b queue and per-visit decisions, not an automatic reschedule.
- [ ] **Approval window vs effective date**: an approved leave takes effect as an `UnavailableDay`; retroactive edits must not rewrite decisions already made. Re-marking the same interval is idempotent and does not duplicate conflicts.
- [ ] **Party visits**: one conflict per party, not one per leg; T-4616a’s single-party rule applies unchanged.

## Out of scope

- Conflict list, resolution actions and client text — **T-4616b**
- HR vacation/sick-leave tracking and approval workflow — **T-4547**
- Standalone barber schedule editor — phase 22
- Automatic rebooking or “reschedule everyone” — forbidden by ADR 0056
