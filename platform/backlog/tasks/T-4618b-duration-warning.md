# T-4618b · Duration edit warns about existing visits

- **Stage**: M1 (phase 4) · **Tags**: frontend, backend, catalog · **Complexity**: junior · **Depends on**: T-4618a, T-024
- **StoryPoints**: 5

## What

When an admin changes a service duration, the form states that the new length applies only to new bookings. Visits already on the calendar keep their start and end.

- The warning is visible before save, not only after.
- The public booking flow shows the current catalog duration for a new visit, and the visit card shows the stored length for an existing one.
- No screen prints a length that disagrees with `end - start` for an existing visit.

## Why

Without the sentence, the founder will assume the calendar moved with the menu. It must not, and the form should say so.

## Sources

- T-4618a
- ADR 0006 (the price form already owes the same kind of warning under MNG-ADM-13; this is the duration twin)
- `docs/acceptance-criteria/04-admin-management.md`

## Done

- [x] Saving a new duration shows the warning and does not rewrite existing visits
- [x] An existing visit card shows the stored length
- [x] A new booking shows the updated catalog length
- [x] A test covers the warning and the unchanged visit

## Risks

- [ ] **Warning only in one app.** Admin is the editor. The public site must not grow its own duration editor here

## Out of scope

- The price warning — **T-024**
- The snapshot itself — **T-4618a**
