# T-4837a · Slice: this studio’s prices on the website

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4837
- **StoryPoints**: 5

## What

Render the prices region on `/locations/{code}` from the public services call for this location’s id. The row is name, duration, price. It does not start a booking by itself.

## Why

The page that names the studio is the page that should name the price.

## Sources

- T-4837
- `apps/web/src/lib/api/catalog.ts`

## Done

- [ ] The request carries this location’s id
- [ ] Each row shows name, duration, and the returned price
- [ ] An empty list omits the heading
- [ ] A test uses two prices and asserts both, and asserts no row when the list is empty

## Risks

- [ ] **The call using the first active location.** `catalog.ts` has a helper that picks the first location. This region does not use that helper

## Out of scope

- The app prices (T-4837b)
