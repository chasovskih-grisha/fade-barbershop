# T-4716a · Specify the next-visit card on the profile

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4716
- **StoryPoints**: 2

## What

Add the card to `docs/web-cabinet-screens.md` §2, above «Акаунт». The rest of the profile order stays.

The card is the nearest upcoming visit from the same list `/account/appointments` already loads.

- Line: weekday and date, start–end, in uk-UA. Then service, barber, location.
- Link «Деталі» goes to `/account/appointments`. It does not open reschedule.
- A visit that is waiting for a deposit keeps the warning badge the visits page already uses. This card does not add a pay button.
- No upcoming visit: «Немає найближчого візиту» and a link «Записатися» to `/booking`.
- Loading: the profile renders. The card is one quiet line, not a page spinner.
- Error: the card is absent. The profile remains. The visits page keeps its own error.

## Why

§2 currently starts at the account form. A card added in code without that line will be treated as extra.

## Sources

- T-4716
- `docs/web-cabinet-screens.md` §2
- `docs/client-screens.md` §1

## Done

- [ ] §2 places the card above «Акаунт» and states the empty, loading, and error states
- [ ] It points «Деталі» at the visits page and leaves actions there
- [ ] `pnpm docs:validate` reports no new error from this file

## Risks

- [ ] **Copying the app card wholesale.** The app card opens payment. This one does not. Deposit stays a badge
