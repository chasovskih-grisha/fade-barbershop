# T-4831 · The studio page is a visit plan

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: senior · **Depends on**: T-030, T-4822, T-4824
- **StoryPoints**: 8

## What

`/locations/{code}` (`LocationDetail.tsx`) is a `max-w-3xl` column: a back link, the logo, the name, the address, then a book button, an underlined map link, and a badge. The listing beside it is a wide poster. The meta description promises prices and barbers the page does not have.

The page becomes one visit plan, same max width as the listing, in this order: hero, actions, hours, contacts, barbers, prices, directions, gallery. The hero uses the first gallery photo when there is one, then the name, the city from T-4821, and the address. The logo stays the mark. Regions that do not have their data yet keep their current blocks in this order and do not reserve an empty band. On a narrow viewport the book control stays on screen while the rest scrolls. The book href stays `/booking` until T-4532.

## Why

The guest who opened LVI-01 needs a sequence: where it is, when it is open, who is there, what it costs, how to arrive. The page is a stack of equal cards.

## Sources

- `apps/web/src/app/locations/[code]/LocationDetail.tsx`
- `apps/web/src/app/locations/[code]/page.tsx`
- `docs/design-system.md`

## Done

- [x] The detail route uses the listing max width, not `max-w-3xl`
- [x] The sections follow the order above when they render (`visit-plan.test.tsx`: `data-section` order)
- [x] A studio with a photo shows that photo in the hero (lowest `sortOrder`); without one, no placeholder image and no gallery band
- [x] Below the wide breakpoint the book control is sticky, then `md:static` (asserted in `visit-plan.test.tsx`)
- [ ] At 320px the page does not scroll sideways — **not verified**: no browser pass at that width, the claim rests on the responsive classes
- [x] `apps/web/src/app/locations/[code]/__tests__/visit-plan.test.tsx` — 4 tests, green

## Risks

- [ ] **The sticky bar covering the last section.** The page adds end padding equal to the bar, so the gallery caption can scroll clear of it

## Out of scope

- The book path (T-4532)
- Filling hours, contacts, gallery, directions, barbers, and prices (T-4832, T-4833, T-4834, T-4835, T-4836, T-4837)
- Live slots on this page (T-130)
- The logo component (T-4609b)

## Implementation plan

Paths:
- apps/web/src/app/locations/[code]/LocationDetail.tsx
- apps/web/src/app/locations/[code]/page.tsx
- apps/web/src/app/locations/[code]/__tests__/visit-plan.test.tsx

Checks:
- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/locations/[code]/__tests__/visit-plan.test.tsx`

## Implementation notes

- apps/web/src/app/locations/[code]/LocationDetail.tsx
- apps/web/src/app/locations/[code]/__tests__/visit-plan.test.tsx

## QA

- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/locations/[code]/__tests__/visit-plan.test.tsx` exit 0
