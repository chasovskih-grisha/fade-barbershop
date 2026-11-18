# T-4736b · Show the chosen price before confirm

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4736a
- **StoryPoints**: 5

## What

On `CommentStep`, above the comment field, show location, service, duration, price, barber, and slot from the booking state. Price uses the service the client selected, formatted as on the service card (`N ₴`). The line under the facts is «Оплата на місці». The confirm button does not move to a payment call. Pass the values in from the page. Do not read them from the DOM.

## Why

The comment step is the last screen before `submitBooking`.

## Sources

- T-4736a
- `apps/web/src/app/booking/steps/CommentStep.tsx`
- `apps/web/src/app/booking/page.tsx`

## Status

**Done** (2026-11-12): `CommentStep` takes `locationName`, `serviceName`, `durationMinutes`, `price`, `barberName` and `time` from the booking state (passed in `booking/page.tsx` from `flow.location`, `flow.service`, the selected barber and `flow.slot`); it renders them in a `<dl aria-label="Ваш візит">` above the comment field, with the service shown as «Назва · N хв», the catalog price as `N ₴` and one line «Оплата на місці». No promo field, no payment button, no second catalog fetch. `comment-step.test.tsx` renders the price and slot next to the confirm button and asserts the promo/pay controls are absent. Verification: web booking 11 suites / 34 tests, `tsc --noEmit` and ESLint clean.

## Done

- [x] The price on this step matches the service card the client picked
- [x] No promo input and no pay button
- [x] A test renders the price and the slot next to the confirm button

## Risks

- [ ] **A second copy of the service.** The step receives the selected service. It does not fetch the catalog again
