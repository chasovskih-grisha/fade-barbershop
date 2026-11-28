# T-4725c · Usual chair on the app profile

- **Stage**: M1 (phase 3) · **Tags**: mobile, ux · **Complexity**: middle · **Depends on**: T-4725a
- **StoryPoints**: 5

## What

Add the same two fields to the app profile, with the same empty option, the same stored ids, and the same unavailable state.

## Why

A preference that exists only on the site is not the client's preference.

## Sources

- T-4725a
- `apps/mobile/src/app/(client)/account/profile/index.tsx`

## Done

- [x] The app shows a choice saved on the site
- [x] «Не обрано» and «Більше не доступно» match the site

## Risks

- [x] **A private catalog.** Use the location and barber endpoints the app home already calls

## Verified

`docs/web-cabinet-screens.md` §2 «Звична локація і барбер» and `docs/client-screens.md` §5 now
carry the rule, and the rule is implemented on both surfaces: `ClientUsualChairController`
(`PATCH /identity/profile/usual-chair`, CRM `UpdateUsualChairHandler`, `ClientProfile.usualChair`),
web `AccountUsualChairCard` + `/api/account/usual-chair`, app `UsualChairCard`. Covered by
`client-usual-chair.controller.spec.ts`, `usual-chair.test.tsx` (web), `usual-chair-card.test.tsx`
(app). Empty saves empty, a stale id shows «Більше не доступно» and clears, and no booking command
runs.
