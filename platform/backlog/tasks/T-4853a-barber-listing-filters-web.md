# T-4853a · Slice: working specialty chips on the website

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, a11y · **Complexity**: middle · **Depends on**: T-4853
- **StoryPoints**: 5

## What

Replace the span pills with buttons. The set is «Усі» plus the distinct specialty strings on the loaded barbers. One is pressed. The grid shows the matching cards.

## Why

The current pills are the bug.

## Sources

- T-4853
- `apps/web/src/app/barbers/page.tsx`

## Done

- [ ] Each chip is a button
- [ ] A specialty chip leaves only barbers who have that specialty
- [ ] «Усі» restores the full list
- [ ] Rank labels are gone
- [ ] A test covers filter, restore, and a list with no specialties

## Risks

- [ ] **A chip longer than the row.** Chips wrap. The page does not scroll sideways at 320px

## Out of scope

- The app chips (T-4853b)
