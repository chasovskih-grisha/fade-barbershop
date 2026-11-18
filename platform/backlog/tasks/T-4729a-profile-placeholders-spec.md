# T-4729a · Specify which profile sections stay hidden

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4729
- **StoryPoints**: 2

## What

In `docs/web-cabinet-screens.md` §2, state that reviews, loyalty, and certificates are absent from the profile until their own tasks ship. Referrals on the profile are a link to `/account/referrals`, not an empty card. `docs/client-screens.md` §5 keeps those sections as specified for when they have data, and says the current app profile does not render an empty copy of them.

## Why

§2 lists the sections as if they are on the page. §5 says to hide a section with no data. The placeholders follow neither.

## Sources

- T-4729
- `docs/web-cabinet-screens.md` §2
- `docs/client-screens.md` §5

## Done

- [ ] §2 names the link and the three hidden sections
- [ ] §5 says the app does not render empty copies
- [ ] `pnpm docs:validate` reports no new error from these files

## Risks

- [ ] **Deleting the future sections from the spec.** They stay described. They are hidden until they have data
