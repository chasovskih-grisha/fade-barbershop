# T-4835a · Slice: a real map on the website studio page

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4835
- **StoryPoints**: 5

## What

Replace `LocationDirections` and the parking card with the single directions region from T-4835. The external link uses the stored coordinates, not a guessed query string alone.

## Why

Two cards of fiction sit where the map should sit.

## Sources

- T-4835
- `apps/web/src/app/locations/[code]/LocationDirections.tsx`
- `apps/web/src/app/locations/[code]/LocationDetail.tsx`

## Done

- [ ] The metro, parking, and coffee paragraphs are not rendered for any location
- [ ] The map shows one pin at `lat`/`lng`
- [ ] The text link opens maps at those coordinates
- [ ] A map failure still shows the address and the link
- [ ] A test asserts the invented sentences are absent

## Risks

- [ ] **Duplicate maps.** This page does not also render the listing map component with every pin

## Out of scope

- The app map (T-4835b)
