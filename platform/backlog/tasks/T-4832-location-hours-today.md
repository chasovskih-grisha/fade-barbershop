# T-4832 · Hours lead with today

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-022, T-4831, T-4850
- **StoryPoints**: 6

## What

`LocationHours` is a flat Monday-to-Sunday list and renders nothing when `hours` is empty, so the card disappears. Today is not marked. The week stays, with today first in emphasis (not by deleting the other days). An empty week is one sentence, not a missing card. Slices: website (T-4832a), app (T-4832b).

## Why

The guest is asking “are they open on the day I am coming”, and the list makes them scan seven identical rows.

## Sources

- `apps/web/src/app/locations/[code]/LocationHours.tsx`
- T-4442 (the live open/closed lamp is separate)
- T-4414 (exceptions)

## Done

- [ ] T-4832a and T-4832b are done
- [ ] The weekly list is still complete

## Risks

- [ ] **Exceptions.** A closure from T-4414 is not drawn here. This task only emphasizes the weekly row. The risk is a guest trusting the weekly row on a holiday — the copy says it is the weekly schedule

## Out of scope

- The open/closed status (T-4442)
- Exception dates (T-4414)
