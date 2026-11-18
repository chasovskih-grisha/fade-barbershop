# T-4825 · The listing skeleton matches the card grid

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, design · **Complexity**: junior · **Depends on**: T-4513, T-4822, T-4824
- **StoryPoints**: 3

## What

`apps/web/src/app/locations/loading.tsx` is a narrow `max-w-3xl` column with two text bars. The page is `max-w-container`, a hero, and a two-column card grid. When the data arrives, the page jumps.

The skeleton uses the same width, hero block, and card grid as the loaded listing, including a photo-shaped block once T-4822 has one. It does not reuse the detail-page skeleton.

## Why

T-4513 shipped a skeleton for the old column. The listing has since grown a different shape, and the jump is back.

## Sources

- `apps/web/src/app/locations/loading.tsx`
- `apps/web/src/app/components/states/LocationListSkeleton.tsx`
- T-4513 (the original states, already done)

## Done

- [ ] The loading route and the loaded route share one max width
- [ ] The skeleton shows a card grid, not a single text column
- [ ] A visual or DOM test asserts the skeleton card count is at least two placeholders

## Risks

- [ ] **Skeleton drift.** The skeleton imports the same layout wrapper as the page, so the next card change moves both

## Out of scope

- Empty and error copy (T-4513 and T-4614e already own those states)
- The detail skeleton (T-4838)
