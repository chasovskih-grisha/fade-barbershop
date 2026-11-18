# T-4860 · The barber profile is a single column of regions

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, design · **Complexity**: senior · **Depends on**: T-4477a, T-4855
- **StoryPoints**: 8

## What

`/barbers/{slug}` is a `max-w-4xl` split: a portrait, then a stack of equal cards, then two buttons. The listing beside it is `max-w-container`. On a phone the book control scrolls away with the fake gallery.

The profile uses the listing width. The order is portrait, name, studios, services, portfolio, reviews, actions. Studios are T-4861. Services and prices stay the region T-4477a fills. Portfolio stays the slot T-191 fills. Reviews stay the slot T-240 fills. This task does not invent haircut names, quotes, or a star count in those slots. On a narrow viewport the book control stays on screen. The href stays the one T-4477b defines; this task does not teach the booking flow to read it.

## Why

The guest who opened a person needs one sequence. The page is a poster beside a pile of cards.

## Sources

- `apps/web/src/app/barbers/[slug]/BarberDetailContent.tsx`
- T-4477a, T-4477b, T-191, T-240

## Done

- [ ] The profile route uses the listing max width
- [ ] The regions follow that order when they render
- [ ] An empty portfolio does not render titled gradient tiles
- [ ] Below the wide breakpoint the book control stays visible while the page scrolls, with end padding so the last region clears it
- [ ] At 320px the page does not scroll sideways
- [ ] A test asserts the region order for a full payload and for a payload with no portfolio

## Risks

- [ ] **The sticky bar covering the book target.** The bar is the book control. The in-flow button is not a second one

## Out of scope

- Slug, biography, prices, and schema without a rating (T-4477a)
- Making `/booking?barber=` select the barber (T-4477b)
- Gallery photos (T-191) and reviews (T-240)
- Live slots (T-130)
