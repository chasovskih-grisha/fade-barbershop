# T-4734c · Visit count on the app profile

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux, mobile · **Complexity**: junior · **Depends on**: T-4734a
- **StoryPoints**: 3

## What

Show the same line under the name on the app profile, from the past visits that screen can already load. Zero and error match slice a.

## Why

The app profile otherwise shows settings and not the history behind them.

## Sources

- T-4734a
- `apps/mobile/src/app/(client)/account/profile/index.tsx`
- `apps/mobile/src/app/(client)/account/appointments/page.tsx`

## Done

- [ ] The line matches the app's past visits
- [ ] A failed load hides it

## Risks

- [ ] **Listing the visits under the name.** The line is the count. The list stays on the visits screen
