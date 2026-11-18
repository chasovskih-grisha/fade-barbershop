# T-4742a · Specify the selected card

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4742
- **StoryPoints**: 2

## What

Add one sentence to the service and barber screens in `docs/booking-flow.md`: the chosen card uses the same bone fill and night text as a chosen slot, and `aria-pressed` is true only on that card. Unselected cards keep their resting style.

## Why

The slot rule is written for slots. The other two steps were left to a ring.

## Sources

- T-4742
- `docs/booking-flow.md`
- `docs/design-system.md`

## Done

- [ ] Both screens point at the slot's selected style
- [ ] `pnpm docs:validate` reports no new error from this file

## Risks

- [ ] **A second token.** The sentence names the slot style. It does not introduce a color
