# T-4826 · The listing shows every studio on one map

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: senior · **Depends on**: T-030, T-4823
- **StoryPoints**: 8

## What

`/locations` has addresses and `lat`/`lng` and no map. The studio page only links out to OpenStreetMap.

On a wide viewport the list and a map share the row. On a narrow viewport the map sits after the first screen of cards, not instead of them. Pins use the stored coordinates. Selecting a pin moves to that card and the reverse. If the map fails to draw, the list is complete and unchanged. The map is drawn on the night surface, not a bright default tile flash. No new geocoder and no new paid map account.

## Why

The guest who does not know the street names is looking at a directory of addresses with no picture of where they sit.

## Sources

- `apps/web/src/lib/api/locations.ts` (`lat`, `lng`)
- `apps/web/src/app/locations/page.tsx`
- T-4405 (coordinates already stored; the admin picker is done)

## Implementation plan

Paths:
- apps/web/src/app/locations/LocationsExplorer.tsx
- apps/web/src/app/locations/LocationsMap.tsx
- apps/web/src/app/locations/use-locations-map.ts
- apps/web/src/app/locations/LocationFinder.tsx
- apps/web/src/app/locations/LocationCityGroups.tsx
- apps/web/src/app/locations/LocationCard.tsx
- apps/web/src/app/locations/page.tsx
- apps/web/src/app/locations/__tests__/map.test.tsx
- apps/web/src/app/locations/__tests__/map-failure.test.tsx

Checks:
- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/locations/__tests__/map.test.tsx`
- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/locations/__tests__/map-failure.test.tsx`

## Done

- [ ] Every active studio with coordinates has one pin
- [ ] Choosing a pin scrolls to that card and sets focus on it; choosing a card marks its pin
- [ ] A failed or blocked map script leaves the list usable, with no blank hole taller than the list
- [ ] The list remains in the accessibility tree when the map is present
- [ ] At 320px the page does not scroll sideways

## Risks

- [ ] **A third-party script as a render dependency.** The list is server-rendered. The map is an enhancement after paint

## Out of scope

- The single-studio map on the detail page (T-4835)
- The admin address picker (T-4405, done)
- Walking times and transit instructions

## Implementation notes

- apps/web/src/app/locations/LocationCard.tsx
- apps/web/src/app/locations/LocationCityGroups.tsx
- apps/web/src/app/locations/LocationFinder.tsx
- apps/web/src/app/locations/LocationsExplorer.tsx
- apps/web/src/app/locations/LocationsMap.tsx
- apps/web/src/app/locations/__tests__/map-failure.test.tsx
- apps/web/src/app/locations/__tests__/map.test.tsx
- apps/web/src/app/locations/use-locations-map.ts

## QA

- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/locations/__tests__/map.test.tsx` exit 0
- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/locations/__tests__/map-failure.test.tsx` exit 0
