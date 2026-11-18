# T-4858 · One barber fills the listing row

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, design · **Complexity**: junior · **Depends on**: T-4855
- **StoryPoints**: 3

## What

The grid is `sm:grid-cols-2 lg:grid-cols-3`. A single barber sits in the first cell. One barber spans the row up to the card’s max portrait width, centered in the grid. Two or more use the existing columns. Zero barbers is unchanged.

## Why

A network can open with one person. A card in the corner of a three-column grid looks unfinished.

## Sources

- `apps/web/src/app/barbers/page.tsx`

## Done

- [ ] One barber renders one card that is not stuck to the left of an empty row
- [ ] Three barbers use three columns at the wide breakpoint
- [ ] The empty state is not restyled

## Risks

- [ ] **The portrait growing to full bleed.** The card keeps the 4/5 crop and a max width. It does not become a banner

## Out of scope

- The empty team copy (T-4614e)
