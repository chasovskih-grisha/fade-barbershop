# T-4837 · The studio page lists this studio’s prices

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-024, T-4831, T-4850
- **StoryPoints**: 10

## What

The studio description promises prices. The page has none. `GET /public/services/active?locationId=` returns services with that studio’s price.

The prices region lists the service name, the duration, and the price for this `locationId`, in the catalog order. It does not show another studio’s price and it does not show a single network price. An empty catalog omits the region. Slices: website (T-4837a), app (T-4837b).

## Why

ADR 0006 makes the price a property of the studio. A page for LVI-01 that hides the price makes the guest start a booking to learn it.

## Sources

- `apps/web/src/lib/api/catalog.ts`
- ADR 0006
- T-024

## Done

- [ ] T-4837a and T-4837b are done
- [ ] The price on the studio page is the price for that `locationId`

## Risks

- [ ] **A price with no currency story.** The figure uses the same `N ₴` writing as the booking card (T-4736). It does not add a second format

## Out of scope

- The services catalog page
- The pricing engine (T-4000) and the home’s one-price list (T-4849)
- Deposits and promo codes
