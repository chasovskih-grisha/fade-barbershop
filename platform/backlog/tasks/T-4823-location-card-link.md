# T-4823 · The listing card opens the studio; booking is a separate control

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, a11y · **Complexity**: middle · **Depends on**: T-030
- **StoryPoints**: 5

## What

Each card ends in two equal buttons, «Записатися» and «Деталі». The card itself is not a link. `role="feed"` is not a list of places.

The whole card navigates to `/locations/{code}`. «Записатися» is a second control, visually secondary, and activating it does not also open the studio. The book href stays `/booking` until T-4532. The list is a `ul`, and each card has one accessible name from the studio name.

## Why

The guest who wants the address, the hours, and the photo is sent through a button that looks the same as the one that starts a booking.

## Implementation plan

Paths:
- apps/web/src/app/locations/LocationCard.tsx
- apps/web/src/app/locations/LocationCityGroups.tsx
- apps/web/src/app/locations/__tests__/location-card-link.test.tsx
- apps/web/src/app/locations/__tests__/LocationCard.test.tsx
- apps/web/src/app/locations/__tests__/page.test.tsx

Checks:
- pnpm --filter @fade/web exec jest apps/web/src/app/locations/__tests__/location-card-link.test.tsx

## Sources

- `apps/web/src/app/locations/page.tsx`
- `docs/ux-guidelines.md` (one primary action)

## Done

- [x] Clicking the card title, photo, or address goes to `/locations/{code}`
- [x] Activating «Записатися» does not navigate to the studio, and its href is unchanged
- [x] Keyboard order is the card link, then the book control, and both show `focus-visible`
- [x] `role="feed"` is gone
- [x] A test asserts the two destinations

## Risks

- [ ] **A link inside a link.** The phone `tel:` and the book control sit outside the card anchor

## Out of scope

- Changing the book path to `/booking/{code}` (T-4532)
- The sticky book bar on the studio page (T-4831)

## Implementation notes

- apps/web/src/app/locations/LocationCard.tsx
- apps/web/src/app/locations/LocationCityGroups.tsx
- apps/web/src/app/locations/__tests__/location-card-link.test.tsx
- apps/web/src/app/locations/__tests__/location-names.test.tsx
- apps/web/src/app/locations/__tests__/page.test.tsx

## QA

- `pnpm --filter @fade/web exec jest apps/web/src/app/locations/__tests__/location-card-link.test.tsx` exit 0
