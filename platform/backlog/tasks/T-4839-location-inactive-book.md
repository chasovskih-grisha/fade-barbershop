# T-4839 · An inactive studio does not offer a booking that looks local

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4513, T-4831
- **StoryPoints**: 6

## What

`LocationInactive` explains that the studio is not taking bookings, then offers «Записатися онлайн», which goes to `/booking` with no mention that this studio is skipped. The guest reads it as a way to book the studio named in the title.

The inactive page names the studio, states that it is not taking bookings, and offers one way forward: the list of other studios. It has no book control. Slices: website (T-4839a), app (T-4839b).

## Why

A closed studio with a primary “book” button is how a guest books the wrong chair.

## Sources

- `apps/web/src/app/locations/[code]/LocationInactive.tsx`
- T-4513 (the inactive state exists; this task changes the action)

## Done

- [ ] T-4839a and T-4839b are done
- [ ] The inactive studio has no control whose label is «Записатися»

## Risks

- [ ] **A guest with only one studio.** The way forward is still the list, even when the list will show the empty state. This task does not special-case a single studio

## Out of scope

- The empty catalog (T-4614e)
- The book path for an active studio (T-4532)
