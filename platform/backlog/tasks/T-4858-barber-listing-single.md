# T-4858 · One barber fills the listing row

- **Stage**: M5 (phase 30) · **Tags**: design, ux · **Complexity**: junior · **Depends on**: T-4855
- **StoryPoints**: 3

## What

The grid is `sm:grid-cols-2 lg:grid-cols-3`. A single barber sits in the first cell. One barber spans the row up to the card’s max portrait width, centered in the grid. Two or more use the existing columns. Zero barbers is unchanged.

## Why

A network can open with one person. A card in the corner of a three-column grid looks unfinished.

## Sources

- `apps/web/src/app/barbers/page.tsx`

## Done

- [x] One barber renders one card that is not stuck to the left of an empty row
- [x] Three barbers use three columns at the wide breakpoint
- [x] The empty state is not restyled

## Risks

- [ ] **The portrait growing to full bleed.** The card keeps the 4/5 crop and a max width. It does not become a banner

## Out of scope

- The empty team copy (T-4614e)

## Implementation plan

Paths:
- packages/ui/src/CardGrid.tsx
- packages/ui/src/CardGrid.test.tsx

Checks:
- pnpm --filter @fade/ui test packages/ui/src/CardGrid.test.tsx

## Implementation notes

- packages/ui/src/CardGrid.test.tsx
- packages/ui/src/CardGrid.tsx

## Re-verified at d92ff74d

The component implements the rule (`packages/ui/src/CardGrid.tsx:11`, `[&>*:only-child]:col-span-full
max-w-md mx-auto w-full`), but the test added in review `f49d72a2` only asserts grid container classes
and child rendering — nothing exercises a single child, a three-child row or the untouched empty state,
so the three `Done` boxes have no proof. Adding that case must happen in a `review` commit (a
post-review test commit is not accepted by the chain); the row stays `review` until then.

## QA

- `pnpm --filter @fade/ui test packages/ui/src/CardGrid.test.tsx` exit 0
