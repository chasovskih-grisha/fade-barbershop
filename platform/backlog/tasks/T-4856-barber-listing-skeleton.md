# T-4856 · The barber listing has a skeleton that matches the cards

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4513, T-4855
- **StoryPoints**: 3

## What

`/barbers` has no `loading.tsx`. The hero and the grid arrive together, or the guest sees a jump.

Add a loading route with the same max width, a hero block, and a grid of portrait-shaped cards. It does not reuse the location skeleton.

## Why

T-4513 covered the public states that existed. This route never got a skeleton of its own shape.

## Sources

- `apps/web/src/app/barbers/page.tsx`
- T-4513
- T-4825 (the location skeleton is a different grid)

## Implementation plan

Paths:
- apps/web/src/app/barbers/loading.tsx
- apps/web/src/app/barbers/BarberGridSkeleton.tsx
- apps/web/src/app/barbers/__tests__/loading.test.tsx

Checks:
- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/barbers/__tests__/loading.test.tsx`

## Done

- [ ] `app/barbers/loading.tsx` renders a card grid at the listing width
- [ ] The skeleton does not include the removed statistic cards
- [ ] A test asserts at least three portrait placeholders

## Risks

- [ ] **Skeleton drift.** The loading file imports the same grid wrapper as the page

## Out of scope

- The profile skeleton (T-4864)
- Empty and error copy already on the page (T-4513, T-4614e)

## Implementation notes

- apps/web/src/app/barbers/BarberGridSkeleton.tsx
- apps/web/src/app/barbers/__tests__/loading.test.tsx
- apps/web/src/app/barbers/loading.tsx

## QA

- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/barbers/__tests__/loading.test.tsx` exit 0
