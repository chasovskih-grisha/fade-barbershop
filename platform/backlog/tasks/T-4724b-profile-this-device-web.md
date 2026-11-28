# T-4724b · Device row on the website profile

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4724a
- **StoryPoints**: 3

## What

On the website account section, add the row from slice a. The link is `/account/devices`. Use the sessions hook the devices page already uses. Do not duplicate the list.

## Why

The aside links to devices by name only. The account card, where the phone is, never says which device this is.

## Sources

- T-4724a
- `apps/web/src/app/account/AccountProfileCard.tsx`
- `apps/web/src/app/account/devices/useDevicesPage.ts`

## Done

- [x] The row shows «Цей пристрій» and links to `/account/devices`
- [x] «Ще N» appears only for a loaded count above zero
- [x] A failed session load still shows the link

## Risks

- [x] **A second fetch shape.** Read the same session list the devices page reads
