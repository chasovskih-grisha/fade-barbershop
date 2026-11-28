# T-4870a · Slice: names and focus on the website barber pages

- **Stage**: M5 (phase 30) · **Tags**: frontend, a11y · **Complexity**: junior · **Depends on**: T-4870
- **StoryPoints**: 3

## What

On `/barbers` and `/barbers/{slug}`, the card’s accessible name is the person’s name. Focus order is breadcrumb, find field, chips, then cards. On the profile it is breadcrumb, actions, then the regions in the visit-plan order.

## Why

The old badges were the only names on the portrait, and they were the same on every card.

## Sources

- T-4870
- `apps/web/src/app/barbers/BarberCard.tsx`

## Implementation plan

Paths:
- apps/web/src/app/barbers/BarbersHeader.tsx
- apps/web/src/app/barbers/__tests__/barber-focus-order.test.tsx

Checks:
- npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/barbers/__tests__/barber-focus-order.test.tsx

## Done

- [x] The card name is the person’s name
- [x] No control’s name is only a symbol
- [x] A test walks the focus order on the listing

## Risks

- [x] **The portrait link and the name both announcing the person.** The card is one link, announced once

## Out of scope

- The app names (T-4870b)

## Implementation notes

- apps/web/src/app/barbers/BarbersHeader.tsx
- apps/web/src/app/barbers/__tests__/barber-focus-order.test.tsx

## QA

- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/barbers/__tests__/barber-focus-order.test.tsx` exit 0
