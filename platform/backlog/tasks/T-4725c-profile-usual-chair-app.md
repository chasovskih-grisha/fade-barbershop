# T-4725c · Usual chair on the app profile

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux, mobile · **Complexity**: middle · **Depends on**: T-4725a
- **StoryPoints**: 5

## What

Add the same two fields to the app profile, with the same empty option, the same stored ids, and the same unavailable state.

## Why

A preference that exists only on the site is not the client's preference.

## Sources

- T-4725a
- `apps/mobile/src/app/(client)/account/profile/index.tsx`

## Done

- [ ] The app shows a choice saved on the site
- [ ] «Не обрано» and «Більше не доступно» match the site

## Risks

- [ ] **A private catalog.** Use the location and barber endpoints the app home already calls
