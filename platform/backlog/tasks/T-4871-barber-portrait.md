# T-4871 · The portrait shows the person

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4610b, T-4855
- **StoryPoints**: 8

## What

The card covers the photo with a gradient at `opacity-90` and a blue glow, then scales it on hover. The profile uses a different crop box. The face is the point of the page.

The card and the profile share one portrait: the 4/5 crop, the photo when T-4610b has one, initials when it does not. No gradient veil. `prefers-reduced-motion` does not scale the image. Slices: website (T-4871a), app (T-4871b).

## Why

A directory of people that hides the photograph has nothing left but the invented badges.

## Sources

- `apps/web/src/app/barbers/BarberCard.tsx`
- `apps/web/src/app/barbers/[slug]/BarberDetailContent.tsx`
- T-4610b

## Done

- [ ] T-4871a and T-4871b are done
- [ ] The portrait is not covered by a gradient

## Risks

- [ ] **A missing photo looking like a broken image.** Initials stay the fallback T-4610b already set. This task does not add a stock face

## Out of scope

- Uploading and consent (T-4610a)
- A new avatar component (T-4507d, T-4610b)
