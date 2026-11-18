# T-4829 · One studio fills the listing row

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, design · **Complexity**: junior · **Depends on**: T-4822, T-4824
- **StoryPoints**: 3

## What

The listing grid is `md:grid-cols-2`. A single active studio sits in the left cell with an empty right cell. One studio spans the row. Two or more use the two-column grid from the first breakpoint that fits two cards. Zero studios is unchanged.

## Why

The network can open on one studio. A half-empty grid looks like a missing card.

## Sources

- `apps/web/src/app/locations/page.tsx`
- T-4614e (zero studios)

## Done

- [ ] One studio renders a single full-width card
- [ ] Two studios render two columns at the wide breakpoint and one column at 320px
- [ ] The empty state is not restyled by this task

## Risks

- [ ] **The map beside a full-width card.** T-4826’s wide layout stacks the map under a single card instead of squeezing it into a phantom second column

## Out of scope

- The empty catalog (T-4614e)
