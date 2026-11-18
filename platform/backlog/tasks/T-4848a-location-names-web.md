# T-4848a · Slice: names and focus on the website location pages

- **Stage**: M5 (phase 30) · **Tags**: frontend, a11y · **Complexity**: junior · **Depends on**: T-4848
- **StoryPoints**: 3

## What

On `/locations` and `/locations/{code}`, remove redundant `aria-label` values that repeat the visible text. The map control’s accessible name does not depend on the arrow character. Focus order is breadcrumb, find field, cards, then the map; on the studio page it is breadcrumb, actions, then the regions in visit-plan order.

## Why

The current labels were written for the old stack of equal buttons.

## Sources

- T-4848
- `apps/web/src/app/locations/page.tsx`
- `apps/web/src/app/locations/[code]/LocationDetail.tsx`

## Done

- [ ] No control’s accessible name is only a symbol
- [ ] Visible text is not duplicated by `aria-label`
- [ ] A test walks the focus order on both pages

## Risks

- [ ] **The map widget taking focus in a loop.** The map is one tab stop into the widget, and tab leaves it back to the list

## Out of scope

- The app names (T-4848b)
