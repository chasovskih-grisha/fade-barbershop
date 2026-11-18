# T-4729c · The app profile does not copy the empty cards

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux, mobile · **Complexity**: junior · **Depends on**: T-4729a
- **StoryPoints**: 3

## What

Confirm the app profile has no empty reviews, loyalty, referrals, or certificates block, and do not add them. If a later slice in this catalog is tempted to mirror `AccountPlaceholders`, this slice's test names the four titles and asserts they are absent.

## Why

The app profile is about to grow real sections. The empty cards are the wrong template.

## Sources

- T-4729a
- `apps/mobile/src/app/(client)/account/profile/index.tsx`

## Done

- [ ] A test asserts the four empty titles are not on the profile

## Risks

- [ ] **Hiding a real section.** Name, phone, preferences, and notifications are not these four
