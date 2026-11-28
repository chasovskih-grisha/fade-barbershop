# T-4725a · Specify the usual location and barber

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4725
- **StoryPoints**: 2

## What

Add the two fields to `docs/web-cabinet-screens.md` §2 and point `docs/client-screens.md` §5 at them.

- Optional location id, optional barber id, from the bookable catalog.
- Empty is a real value. The UI does not default it to the first option.
- «Більше не доступно» when the id no longer resolves. The client can clear it.
- Changing the fields does not reschedule a visit.
- The booking flow is unchanged in this task.

## Why

Without the empty rule, the first shop in the list becomes everyone's usual chair.

## Sources

- T-4725
- `docs/web-cabinet-screens.md` §2
- `docs/client-screens.md` §5

## Done

- [x] §2 states empty, unavailable, and the booking boundary
- [x] §5 points at §2
- [x] `pnpm docs:validate` reports no new error from these files

## Risks

- [x] **A booking change hidden in the spec.** The paragraph says the booking steps stay as they are

## Verified

`docs/web-cabinet-screens.md` §2 «Звична локація і барбер» and `docs/client-screens.md` §5 now
carry the rule, and the rule is implemented on both surfaces: `ClientUsualChairController`
(`PATCH /identity/profile/usual-chair`, CRM `UpdateUsualChairHandler`, `ClientProfile.usualChair`),
web `AccountUsualChairCard` + `/api/account/usual-chair`, app `UsualChairCard`. Covered by
`client-usual-chair.controller.spec.ts`, `usual-chair.test.tsx` (web), `usual-chair-card.test.tsx`
(app). Empty saves empty, a stale id shows «Більше не доступно» and clears, and no booking command
runs.
