# T-4849 · The app home does not show one price as every studio’s price

- **Stage**: M5 (phase 30) · **Tags**: mobile, ux · **Complexity**: middle · **Depends on**: T-024, T-4845
- **StoryPoints**: 5

## What

Under the location rows, `IndexHome` lists services with `srv.price` and a duration. Prices belong to a studio (ADR 0006). The home is not a studio.

The home service list drops the price figure. It may keep the service name and the duration, which are catalog facts. The price is shown on the studio screen (T-4837b), scoped to that studio. The home does not compute a “from” price.

## Why

A single ₴ figure under a list of several studios tells the guest the price is the same everywhere.

## Sources

- `apps/mobile/src/app/index-home.tsx`
- `apps/mobile/src/lib/api/catalog.ts`
- ADR 0006

## Implementation plan

Paths:
- apps/mobile/src/app/home-service-facts.ts
- apps/mobile/src/app/home-sections.tsx
- apps/mobile/src/app/home-service-facts.test.tsx

Checks:
- `npx jest --config apps/mobile/jest.config.js --runTestsByPath apps/mobile/src/app/home-service-facts.test.tsx`

## Done

- [ ] The home service rows do not render a price
- [ ] Name and duration remain
- [ ] A test with two locations asserts no ₴ figure in the home services block

## Risks

- [ ] **A guest who used the home as a price list.** The studio screen is the price list. The home does not add a second, weaker one

## Out of scope

- The studio price section (T-4837)
- The pricing engine (T-4000)

## Implementation notes

- apps/mobile/src/app/home-sections.tsx
- apps/mobile/src/app/home-service-facts.test.tsx
- apps/mobile/src/app/home-service-facts.ts

## QA

- `npx jest --config apps/mobile/jest.config.js --runTestsByPath apps/mobile/src/app/home-service-facts.test.tsx` exit 0
