# T-4732a · Specify the profile doors

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4732
- **StoryPoints**: 2

## What

Add a short list under `docs/client-screens.md` §5 for the app profile: «Мої візити» and «Пристрої» open the screens already in the tree. Referrals are not listed. In `docs/web-cabinet-screens.md` §2, state that the aside is the only navigation between those sections. The profile body does not repeat it.

## Why

§5 describes sections of the profile and not how the app reaches visits. The website shell and the profile body are about to both become menus if nobody says which one is the menu.

## Sources

- T-4732
- `docs/client-screens.md` §5
- `docs/web-cabinet-screens.md` §2

## Done

- [ ] §5 lists the two app rows and excludes referrals
- [ ] §2 says the aside is the only menu
- [ ] `pnpm docs:validate` reports no new error from these files

## Risks

- [ ] **Replacing the tab table.** The navigation table at the top of the client screens stays
