# T-4871a · Slice: one portrait on the website card and profile

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4871
- **StoryPoints**: 5

## What

Extract one portrait used by `BarberCard` and `BarberDetailContent`. Remove the veil and the hover scale. Keep the initials fallback.

## Why

Two crops of the same person already disagree.

## Sources

- T-4871
- `apps/web/src/app/barbers/BarberCard.tsx`
- `apps/web/src/app/barbers/[slug]/BarberDetailContent.tsx`

## Done

- [ ] Card and profile render the same component
- [ ] A photo is fully visible
- [ ] Reduced motion disables the scale
- [ ] A test covers a photo and a missing photo

## Risks

- [ ] **The card height collapsing.** The 4/5 frame keeps its ratio when the image is absent

## Out of scope

- The app portrait (T-4871b)

## Blocking evidence

`apps/web/src/app/components/BarberPortrait.tsx` is already rendered by the barber card and by the `/barbers/[slug]` detail page. Nothing in the row is missing from `apps/web`, so the gate has no product diff to review and the row stays `todo`.

## Implementation plan

Paths:
- `apps/web/src/app/barbers/__tests__/BarberPortrait.test.tsx`

Checks:
- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/barbers/__tests__/BarberPortrait.test.tsx`

## QA

- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/barbers/__tests__/BarberPortrait.test.tsx` exit 0
