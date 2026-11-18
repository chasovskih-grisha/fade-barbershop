# T-4732b · Keep a single cabinet menu on the website

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4732a
- **StoryPoints**: 3

## What

Leave `AccountShell` as the only set of links between profile, visits, devices, and referrals. Do not add those four links again inside the profile page. If a test renders the profile page, it does not find a second "My visits" link in the page body. The aside test still finds one.

## Why

The aside is easy to duplicate once the profile page is being filled in.

## Sources

- T-4732a
- `apps/web/src/app/account/components/AccountShell.tsx`
- `apps/web/src/app/account/page.tsx`

## Done

- [ ] The profile body has no duplicate section nav
- [ ] The aside still links to the four routes

## Risks

- [ ] **Removing the aside.** This slice keeps it
