# T-4726c · Missing-name prompt on the app

- **Stage**: M1 (phase 3) · **Tags**: mobile, ux · **Complexity**: junior · **Depends on**: T-4726a, T-4719c
- **StoryPoints**: 3

## What

The app profile uses the same prompt above the name field from T-4719c, under the same empty rule.

## Why

The app is the other place the client meets their account.

## Sources

- T-4726a
- `apps/mobile/src/app/(client)/account/profile/index.tsx`

## Done

- [ ] The prompt matches the site and hides after a name is stored

## Risks

- [ ] **A launch modal.** The prompt is part of the profile screen
