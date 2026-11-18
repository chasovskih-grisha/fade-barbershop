# T-4871a · Slice: one portrait on the website card and profile

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, design · **Complexity**: middle · **Depends on**: T-4871
- **StoryPoints**: 5

## What

Extract one portrait used by `BarberCard` and `BarberDetailContent`. Remove the veil and the hover scale. Keep the initials fallback.

## Why

Two crops of the same person already disagree.

## Sources

- T-4871
- `apps/web/src/app/barbers/BarberCard.tsx`
- `apps/web/src/app/barbers/[slug]/BarberDetailContent.tsx`

## Done

- [ ] Card and profile render the same component
- [ ] A photo is fully visible
- [ ] Reduced motion disables the scale
- [ ] A test covers a photo and a missing photo

## Risks

- [ ] **The card height collapsing.** The 4/5 frame keeps its ratio when the image is absent

## Out of scope

- The app portrait (T-4871b)
