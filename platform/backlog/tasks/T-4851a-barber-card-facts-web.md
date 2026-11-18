# T-4851a · Slice: barber card facts on the website

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4851
- **StoryPoints**: 5

## What

Remove the default specialties, the default experience, and both badges from `BarberCard`. A missing list renders no chips. A missing experience renders no years. The name stays the title.

## Why

The defaults live in the component, so they survive even after the profile data is real.

## Sources

- T-4851
- `apps/web/src/app/barbers/BarberCard.tsx`

## Done

- [ ] Two barbers with different specialties render different chips
- [ ] A barber with no specialties and no experience renders the name and no invented lines
- [ ] The strings «Вільні вікна сьогодні» and «Експерт Fade» are absent
- [ ] A test covers both payloads

## Risks

- [ ] **The brand line «Fade Atelier» on every card.** It is not a fact about the person and it leaves with the badges

## Out of scope

- The app card (T-4851b)
