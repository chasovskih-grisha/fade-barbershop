# T-4724c · Device row on the app profile

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux, mobile · **Complexity**: junior · **Depends on**: T-4724a
- **StoryPoints**: 3

## What

Add the same row to the app profile. The link opens `(client)/account/devices`. Count and error behave as in slice a.

## Why

The app devices screen exists and the profile does not point at it.

## Sources

- T-4724a
- `apps/mobile/src/app/(client)/account/profile/index.tsx`
- `apps/mobile/src/app/(client)/account/devices/page.tsx`

## Done

- [ ] The row opens the existing devices screen
- [ ] It does not render the device list inline

## Risks

- [ ] **A new devices route.** Use the screen that is already in the tree
