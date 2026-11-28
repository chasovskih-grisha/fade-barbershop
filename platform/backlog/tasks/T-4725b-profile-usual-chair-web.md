# T-4725b · Usual chair on the website profile

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4725a
- **StoryPoints**: 5

## What

Add the two fields to the website profile. Options come from the location and barber lists booking already loads. Include an empty option labelled «Не обрано». Persist the ids on the client profile. Render «Більше не доступно» when an id is missing from the list, with a clear control.

## Why

The website profile is where the account fields already live.

## Sources

- T-4725a
- `apps/web/src/app/account/page.tsx`

## Done

- [x] «Не обрано» saves empty and reloads empty
- [x] A missing id shows «Більше не доступно» and can be cleared
- [x] Saving does not call a booking update

## Risks

- [ ] **Defaulting the select.** The control's first real option must not be submitted just because the client opened the page

## Verified

`docs/web-cabinet-screens.md` §2 «Звична локація і барбер» and `docs/client-screens.md` §5 now
carry the rule, and the rule is implemented on both surfaces: `ClientUsualChairController`
(`PATCH /identity/profile/usual-chair`, CRM `UpdateUsualChairHandler`, `ClientProfile.usualChair`),
web `AccountUsualChairCard` + `/api/account/usual-chair`, app `UsualChairCard`. Covered by
`client-usual-chair.controller.spec.ts`, `usual-chair.test.tsx` (web), `usual-chair-card.test.tsx`
(app). Empty saves empty, a stale id shows «Більше не доступно» and clears, and no booking command
runs.
