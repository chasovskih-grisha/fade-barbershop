# T-4735b · Strip the success screen back to the visit

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4735a
- **StoryPoints**: 5

## What

Change `SuccessStep` to the note in slice a. Pass location as well as service, barber, and time from the booking page. Remove the chip widget, the stars, the reminder button, the «Нагадування активні» badge, the Telegram link, and the Google Calendar URL. Keep «Мої візити» and «На головну». Use design-system tokens. No `text-amber-500` and no `bg-action-primary`.

## Why

The component is the screen clients see after `submitBooking` returns.

## Sources

- T-4735a
- `apps/web/src/app/booking/steps/SuccessStep.tsx`
- `apps/web/src/app/booking/page.tsx`

## Status

**Done** (2026-11-12): `SuccessStep` now always renders location, service, barber and time (location is passed from `booking/page.tsx` as `flow.location?.name`); the reference thumbnail and comment row appear only when present. Removed the preference chips, the star rating, the reminder button + «Нагадування активні» badge, the Telegram link and the dateless Google Calendar URL. Kept «Мої візити» (`/account/appointments`, renamed from «Мої записи») and «На головну», on design-system tokens (`rounded-card`, `border-line`, `bg-surface-raised`). Tests: `success-step.test.tsx` covers the four facts without a reference and asserts the removed controls are absent. Verification: web 106 suites / 314 tests, `tsc --noEmit` and ESLint clean on changed files.

## Done

- [x] A visit with no reference shows the four facts
- [x] The removed controls are absent, including the dateless calendar URL
- [x] The existing success test covers the four facts

## Risks

- [ ] **Hiding the photo.** A reference that was uploaded still shows. Only the gate that hid the facts goes away
