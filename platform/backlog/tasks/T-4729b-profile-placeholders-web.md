# T-4729b · Replace the website placeholder cards

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4729a
- **StoryPoints**: 3

## What

Remove the reviews, loyalty, and certificates `EmptyState`s from `AccountPlaceholders`. Replace the referrals empty state with a link to `/account/referrals` labelled «Реферальна програма». Delete the component if nothing remains to render.

## Why

The four states are hardcoded on the profile page.

## Sources

- T-4729a
- `apps/web/src/app/account/AccountPreferencesCard.tsx`
- `apps/web/src/app/account/page.tsx`

## Done

- [ ] Those three empty titles are gone from the profile
- [ ] The referrals link opens the existing page

## Risks

- [ ] **A new referrals page.** Link the one that exists
