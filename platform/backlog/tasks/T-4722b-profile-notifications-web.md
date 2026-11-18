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

- [ ] Reload shows the saved four values
- [ ] A failed save restores the last saved values
- [ ] Marketing can be off while SMS stays on

## Risks

- [ ] **Sharing one banner with the name.** This card's confirmation is its own. The shared banner split is T-4727 if it is still shared
