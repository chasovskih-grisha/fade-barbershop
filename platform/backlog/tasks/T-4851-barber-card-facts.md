# T-4851 · A barber card states only what that barber record knows

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-030, T-4610b
- **StoryPoints**: 8

## What

`BarberCard` fills every missing prop with the same story: specialties «Класичні стрижки», «Моделювання бороди», «Експертний фейд», experience «6+ років досвіду», a pulsing «Вільні вікна сьогодні», and «Експерт Fade». The listing at `/barbers` then looks like one person copied across the grid. The URL the guest opened, `/barbers/93b42217-e3a3-54c7-ba23-1e6f30585351`, is one of those people.

The card shows the name, the role when the record has one, and experience or specialties only when that barber’s record has them. It does not claim a free window and it does not award a rank. Slices: website (T-4851a), app (T-4851b).

## Why

A guest choosing a person is reading a promise. The same promise on every card is not a choice.

## Sources

- `apps/web/src/app/barbers/BarberCard.tsx`
- `apps/web/src/app/barbers/page.tsx`
- T-130 (real free windows), T-4477a (the profile biography)

## Implementation plan

The card itself stopped inventing facts in T-4851a. The same promise still
leaked from the listing page: `/barbers` writes JSON-LD `Person` entries for the
cards and gives every barber without a role the title «Майстер-барбер». The plan
builds that entry from the record only, so a role-less barber has no job title.

Paths:
- apps/web/src/app/barbers/page.tsx
- apps/web/src/app/barbers/barbers-json-ld.ts
- apps/web/src/app/barbers/__tests__/barbers-json-ld.test.ts

Checks:
- npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/barbers/__tests__/barbers-json-ld.test.ts

## Done

- [x] The listing's `Person` entry carries a job title only when the record has one
- [x] No card or listing entry says «Вільні вікна сьогодні» or «Експерт Fade»
- [x] T-4851a and T-4851b are done

## Risks

- [ ] **A card with only a name.** That is a valid card. The grid does not invent a subtitle to fill the gap

## Out of scope

- The live slot block (T-130)
- The profile biography and the mapper’s invented bios (T-4477a)
- The photo pipeline and the initials fallback (T-4610b)

## Implementation notes

- apps/web/src/app/barbers/__tests__/barbers-json-ld.test.ts
- apps/web/src/app/barbers/barbers-json-ld.ts

## QA

- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/barbers/__tests__/barbers-json-ld.test.ts` exit 0


