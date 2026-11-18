# T-4722 · Notification switches that survive a reload

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-032, T-072
- **StoryPoints**: 12

## What

The website notification card has four switches: SMS reminders, email, push, and marketing. Their save waits 400ms and writes nothing. A reload restores the hardcoded defaults. The app profile prints the Expo push token and ties «Вийти» to turning notifications off.

Persist the four booleans on the client profile. Both screens read them back. Marketing off does not turn off visit reminders. Turning push off does not sign the client out.

The app does not show the token string. The push switch registers or revokes the push token the app already knows how to register. The other three switches save with it.

## Why

A switch that resets teaches the client that the account ignores them. A token on screen is not a setting.

## Sources

- `apps/web/src/app/account/AccountNotificationsCard.tsx`
- `apps/web/src/app/account/page.tsx`
- `apps/mobile/src/app/(client)/account/profile/index.tsx`
- `docs/client-screens.md` §5

## Done

- [ ] Slices a, b, and c are `done`
- [ ] Reload shows the saved switches, not the defaults
- [ ] The app profile no longer renders the Expo token
- [ ] Turning push off leaves the client signed in

## Risks

- [ ] **A notification platform.** This stores the client's choices. It does not build senders, quiet hours, or web-push subscription (T-4449)
- [ ] **Visit reminders following the marketing switch.** Marketing is the only optional commercial switch. SMS, email, and push for a visit stay independent

## Out of scope

- Campaign sending and birthday messages (T-4459, T-4730)
- The devices list (T-4724)
