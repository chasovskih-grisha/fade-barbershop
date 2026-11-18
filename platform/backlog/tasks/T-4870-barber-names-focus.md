# T-4870 · The barber directory and the profile name their controls

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, a11y · **Complexity**: junior · **Depends on**: T-4859, T-4860, T-4867
- **StoryPoints**: 6

## What

After the layout tasks, every control on these surfaces has a visible name, the name is not repeated by a second label, and focus follows the visual order. Slices: website (T-4870a), app (T-4870b).

## Why

A directory of people that a screen reader cannot tell apart is a directory for one kind of guest.

## Sources

- `apps/web/src/app/barbers/page.tsx`
- `apps/web/src/app/barbers/BarberCard.tsx`
- T-4510 (the harness). This task is the names on these routes

## Done

- [ ] T-4870a and T-4870b are done

## Risks

- [ ] **Labels that move the layout.** This task renames. It does not reorder regions

## Out of scope

- The axe harness and the skip link (T-4510, T-4510b)
