# T-4618a · Agreed duration on the visit

- **Stage**: M1 (phase 4) · **Tags**: backend, scheduling · **Complexity**: middle · **Depends on**: T-040
- **StoryPoints**: 8

## What

Freeze the length when the visit is booked.

- At `book`, copy the catalog duration that was used (including `parallelDuration` when the party mode needs it) onto the visit as `AgreedDuration` minutes. `end` is `start + AgreedDuration`. After that, catalog duration is not read for this visit.
- A later catalog edit does not update `AgreedDuration` or `end` on existing visits.
- Slot search treats the stored `end` as occupied. Two chairs still cannot overlap.
- A party stores one agreed length for the party, matching ADR 0011 (90 sequential, 50 parallel). Legs do not each grow when the catalog changes.

No backfill of historical rows beyond `end - start`. That difference is already the booked length.

## Why

The chair graph is the business. If it follows the catalog instead of the booking, a menu edit double-books the room.

## Sources

- T-4618
- ADR 0006, ADR 0011
- `apps/api/src/scheduling/application/admin-booking-detail.map.ts` (minutes already come from `end - start`)

## Done

- [x] New visits persist `AgreedDuration` and an `end` derived from it
- [x] A catalog duration change leaves existing `end` values untouched
- [x] Slot search uses stored ends
- [x] A test books two adjacent visits, lengthens the service, and shows the second visit still starts on time
- [x] A party test covers both modes

## Risks

- [ ] **Null duration on old rows.** Derive from `end - start` when the column is empty. Do not invent the current catalog value
- [ ] **Clock skew.** Duration is minutes, not a second timestamp from the client

## Out of scope

- The admin warning copy — **T-4618b**
- Moving a visit — **T-4533**
