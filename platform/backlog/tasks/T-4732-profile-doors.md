# T-4732 · The profile opens the account screens that exist

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-032, T-072
- **StoryPoints**: 10

## What

The website cabinet already has an aside: Профіль, Мої візити, Пристрої, Реферали. The app profile is a dead end. Visits and devices exist as screens and are not linked from the profile.

On the app profile, add two rows: «Мої візити» to `(client)/account/appointments`, and «Пристрої» to `(client)/account/devices`. Do not add a referrals row. The app has no referrals route.

On the website, the profile page does not grow a second copy of the aside. The aside remains the door. This task only checks the four aside labels still match the routes, and that the profile content does not repeat them as another menu.

## Why

A client in the app who is looking at their profile cannot reach the visits screen except by knowing the route. The website already solved that with the aside and should not solve it twice.

## Sources

- `apps/web/src/app/account/components/AccountShell.tsx`
- `apps/mobile/src/app/(client)/account/profile/index.tsx`
- `docs/client-screens.md` §5

## Done

- [ ] Slices a, b, and c are `done`
- [ ] The app profile opens visits and devices
- [ ] The app profile has no referrals row
- [ ] The website profile does not render a second navigation list

## Risks

- [ ] **Building the five-tab shell.** T-070 owns tabs. These are rows on the profile
- [ ] **An app referrals screen.** No route, no row

## Out of scope

- The device summary row (T-4724). That row is about this phone. «Пристрої» is the list
- Empty program cards (T-4729)
