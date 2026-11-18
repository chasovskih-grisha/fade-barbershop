# T-4865 · An inactive barber is not offered as if they were working

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-023, T-4860
- **StoryPoints**: 6

## What

The public mapper sets `active: true` on everyone it returns. A deactivated barber must not appear in the directory and must not offer «Записатися» on a direct open.

The directory omits inactive barbers. A direct open of an inactive person names them, says they are not taking bookings, and links back to `/barbers`. There is no book control. Slices: website (T-4865a), app (T-4865b).

## Why

A book button on someone who no longer works is a booking for the wrong chair.

## Sources

- `apps/web/src/lib/api/staff.ts`
- T-4839 (the same rule for a studio)

## Done

- [ ] T-4865a and T-4865b are done
- [ ] An inactive person has no «Записатися» control

## Risks

- [ ] **The list endpoint already dropping inactive people.** The direct-open case still handles `active: false`

## Out of scope

- Deactivating the account (admin, T-023)
- The booking flow’s ignore-unknown rule (T-4477b)
