# T-4722a · Specify the four profile switches

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4722
- **StoryPoints**: 2

## What

Add the four switches to `docs/web-cabinet-screens.md` §2 and point `docs/client-screens.md` §5 at them.

- SMS reminders, email about the visit, push, marketing.
- Stored on the client profile. Default when nothing is stored yet: SMS and email on, push and marketing off. That matches the website card's current initial state, except push starts off because the card already does.
- Marketing does not change the other three.
- Push off does not sign the client out.
- The app does not display a push token.
- The website sentence under push says the browser, not the phone. The app sentence says the phone. The switch is the same boolean.

## Why

§5 says the profile has personal push switches and leaves them to a later phase. The website already drew four switches that do not persist. The spec has to name those four, not a new set.

## Sources

- T-4722
- `docs/web-cabinet-screens.md` §2
- `docs/client-screens.md` §5
- `apps/web/src/app/account/AccountNotificationsCard.tsx`

## Done

- [x] Both docs name the four switches, the defaults, and the two separations
- [x] `pnpm docs:validate` reports no new error from these files

## Risks

- [ ] **New channels.** No fifth switch in this slice
