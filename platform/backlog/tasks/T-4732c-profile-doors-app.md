# T-4732c · Visits and devices from the app profile

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux, mobile · **Complexity**: middle · **Depends on**: T-4732a
- **StoryPoints**: 5

## What

Add «Мої візити» and «Пристрої» to the app profile. They open the existing screens. There is no «Реферали» row.

## Why

Those two screens are in the tree and unreachable from the profile.

## Sources

- T-4732a
- `apps/mobile/src/app/(client)/account/profile/index.tsx`

## Done

- [ ] Each row opens the existing screen
- [ ] Referrals is not on the profile

## Risks

- [ ] **A tab bar.** Rows on the profile, not a new navigator
