# T-4843 · The app home lists studios as cards that open

- **Stage**: M5 (phase 30) · **Tags**: mobile, ux · **Complexity**: middle · **Depends on**: T-070, T-4844, T-4609d
- **StoryPoints**: 5

## What

`IndexHome` renders each location as one line, `{name} — {address}`, inside a view that does not press. There is no way into a studio.

Each studio is a card: name, address, and the city when T-4821b has grouped them. Pressing the card opens the studio screen from T-4844. The services block under the list stays. The network mark from T-4609d stays; this task does not redraw it.

## Why

The app’s location “list” cannot be chosen. It is a paragraph.

## Sources

- `apps/mobile/src/app/index-home.tsx`
- `apps/mobile/src/app/index.styles.ts`
- T-4609d (the mark on the home screen)

## Done

- [ ] Each active studio is a named control
- [ ] Pressing it opens `/locations/{code}` in the app
- [ ] The services block is still below the studios
- [ ] A test presses a card and asserts the route

## Risks

- [ ] **The card before the screen exists.** This task depends on T-4844. It does not push a route that 404s

## Out of scope

- The network mark (T-4609d)
- Card facts that have their own slices (city T-4821b, chairs T-4830b, today’s hours T-4832b)
- The find field (T-4828b)

## Implementation plan

The card and its press already ship; what is missing is the route test and one
place that owns the href.

Paths:
- `apps/mobile/src/app/location-city-groups.tsx`
- `apps/mobile/src/app/location-city-groups.test.tsx`

Checks:
- `npx jest --config apps/mobile/jest.config.js --runTestsByPath apps/mobile/src/app/location-city-groups.test.tsx`

## Implementation notes

- apps/mobile/src/app/location-city-groups.test.tsx
- apps/mobile/src/app/location-city-groups.tsx

## QA

- `npx jest --config apps/mobile/jest.config.js --runTestsByPath apps/mobile/src/app/location-city-groups.test.tsx` exit 0
