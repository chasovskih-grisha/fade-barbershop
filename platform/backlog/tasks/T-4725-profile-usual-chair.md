# T-4725 · A usual location and a usual barber on the profile

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-032, T-072
- **StoryPoints**: 12

## What

The profile has no place for the chair the client usually wants. Booking starts from a blank choice every time.

Add two optional fields on both profiles: a location and a barber, chosen from the locations and barbers the booking flow already lists. Empty means no preference. It is not the first row of the catalog. Clearing a field stores empty. Saving does not move a visit that is already booked.

The fields show the chosen names. A location or barber that is no longer bookable shows «Більше не доступно» and can be cleared. It is not silently replaced.

## Why

Repeat clients already know the chair. The account, which is where they would set that, cannot remember it.

## Sources

- `docs/web-cabinet-screens.md` §2
- `docs/client-screens.md` §5
- `apps/web/src/app/account/page.tsx`
- `apps/mobile/src/app/(client)/account/profile/index.tsx`

## Done

- [x] Slices a, b, and c are `done`
- [x] A choice saved on the site is the choice on the app
- [x] Empty stays empty, including when the catalog has rows
- [x] An existing visit does not change when the preference changes

## Risks

- [x] **Prefilling the booking flow.** Showing the preference on the profile does not change step 0 or step 2 of booking. That would be a later task
- [x] **A free-text shop name.** The choices are ids from the catalog the booking screens use

## Out of scope

- Booking pin tasks (T-4711, T-4714)
- Admin assignment of a barber
- Moving an existing visit

## Verified

`docs/web-cabinet-screens.md` §2 «Звична локація і барбер» and `docs/client-screens.md` §5 now
carry the rule, and the rule is implemented on both surfaces: `ClientUsualChairController`
(`PATCH /identity/profile/usual-chair`, CRM `UpdateUsualChairHandler`, `ClientProfile.usualChair`),
web `AccountUsualChairCard` + `/api/account/usual-chair`, app `UsualChairCard`. Covered by
`client-usual-chair.controller.spec.ts`, `usual-chair.test.tsx` (web), `usual-chair-card.test.tsx`
(app). Empty saves empty, a stale id shows «Більше не доступно» and clears, and no booking command
runs.
