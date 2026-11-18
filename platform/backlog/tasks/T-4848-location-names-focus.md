# T-4848 · The listing and the studio page name their controls

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, a11y · **Complexity**: junior · **Depends on**: T-4823, T-4831, T-4844
- **StoryPoints**: 6

## What

The listing uses `role="feed"` and `aria-label` strings that repeat the visible name. The map link is «Показати на карті ↗». The app rows have no role.

After the layout tasks, every control on these surfaces has a visible name, the name is not repeated by a second label, and focus order follows the visual order. Slices: website (T-4848a), app (T-4848b).

## Why

A directory that a keyboard and a screen reader cannot walk is a directory for one kind of guest.

## Sources

- `apps/web/src/app/locations/page.tsx`
- `apps/web/src/app/locations/[code]/LocationDetail.tsx`
- T-4510 (the harness). This task is the names on these routes, not the CI harness

## Done

- [ ] T-4848a and T-4848b are done

## Risks

- [ ] **Labels that fight the layout tasks.** This slice lands after the controls exist, and it renames them. It does not move them

## Out of scope

- The axe CI harness, skip link, and focus trap (T-4510, T-4510a, T-4510b)
- Turning the card into a link (T-4823) and the breadcrumb (T-4842)
