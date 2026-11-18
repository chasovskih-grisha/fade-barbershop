# T-4618 · Visit length stays fixed after booking

- **Stage**: M1 (phase 4) · **Tags**: backend, scheduling · **Complexity**: senior · **Depends on**: T-040, T-024
- **StoryPoints**: 13

## What

A booked visit keeps the length it was given at booking. Editing the service duration in the catalog changes only future bookings.

`AgreedPrice` already does this for money (ADR 0006). Time does not. The visit stores `start` and `end`, and the admin detail view derives minutes from those two fields, but nothing stops a later duration edit from being treated as the length of visits that already exist. On two chairs, stretching a 45-minute service to 60 minutes under an existing booking overlaps the next client.

This epic stores the booked length and makes slot generation trust the stored end, not the live catalog duration.

## Why

The next client is already promised a chair. A catalog edit must not move that promise.

## Sources

- ADR 0006 (price snapshot; this epic is the same rule for time)
- ADR 0011 (a father-son party keeps the length of its mode, on the party, not on each leg)
- `docs/ubiquitous-language.md` (AgreedDuration)
- T-024 (catalog edits), T-040 (chair invariant)

## Done

- [ ] Slices a and b are `done`
- [ ] Changing a service duration does not move the end of any existing visit
- [ ] `pnpm docs:validate` passes

## Risks

- [ ] **Recomputing the end on read.** Any screen that does `start + current catalog duration` is a bug. The end on the visit is the source
- [ ] **Party.** Sequential and parallel lengths stay on the party. This epic does not re-slice legs

## Out of scope

- Price edits and the admin price warning — **T-024**
- Composite services — **T-4520**
- Reschedule, which picks a new slot and a new end — **T-4533**
