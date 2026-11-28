# T-4722b · Persist the website notification switches

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4722a
- **StoryPoints**: 5

## What

Replace the timeout in `handleSaveNotifPrefs` with a save to the client profile. Load the stored booleans when the account page opens. Until they load, the switches are disabled, not flashed at the defaults and then corrected.

Saving sets "Saved" on this card only. A failure says "Failed to save notifications" and puts the switches back to the last saved values.

## Why

The card already looks finished. The handler does not store anything.

## Sources

- T-4722a
- `apps/web/src/app/account/page.tsx`
- `apps/web/src/app/account/AccountNotificationsCard.tsx`

## Done

- [x] Reload shows the saved four values
- [x] A failed save restores the last saved values
- [x] Marketing can be off while SMS stays on

## Risks

- [x] **Sharing one banner with the name.** This card's confirmation is its own. The shared banner split is T-4727 if it is still shared

## Implementation plan

- `apps/web/src/app/api/account/notifications/route.ts` — GET/PATCH proxy: resolve the client id via
  `GET /identity/profile`, then read or upsert `/client/notifications/preferences/:clientId`.
- `apps/web/src/app/account/notification-preferences.ts` — the four card switches, API field mapping
  (`marketingOffers` ↔ inverted `loyaltyOptOut`) and defaults for missing fields.
- `apps/web/src/app/account/useNotificationPreferences.ts` — loads on mount, keeps switches disabled
  until loaded, saves on demand and restores the last saved values on failure.
- Tests: `apps/web/src/app/account/account-notifications.test.tsx`,
  `apps/web/src/app/account/notification-preferences.test.ts`.
- Checks: `pnpm --filter @fade/web exec jest src/app/account/account-notifications.test.tsx src/app/account/notification-preferences.test.ts`.
