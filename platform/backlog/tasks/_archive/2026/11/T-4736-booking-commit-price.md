# T-4736 · The step that books shows the price the client already chose

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-041
- **StoryPoints**: 7

## What

The service step shows duration and price. The last step, `CommentStep`, asks for a comment and then "Confirm booking" with no price, no location, and no time. Screen 5 of the flow is a price breakdown. That breakdown depends on discounts and a deposit, which are T-090 and T-091 and are not built.

Until those exist, the commit step repeats the facts the client already decided: location, service name, duration, the catalog price in ₴ with no kopecks, barber, and the slot. Under them, one line: "Payment on site". It does not print a 30% deposit, a promo field, or a card form.

## Why

The price is on an earlier step and gone at the moment of commitment. A client can confirm a visit without seeing what it costs.

## Sources

- `apps/web/src/app/booking/steps/CommentStep.tsx`
- `apps/web/src/app/booking/steps/ServiceStep.tsx`
- `docs/booking-flow.md` screen 5
- T-090
- T-091

## Status

**Done** (2026-11-12): slices a (screen-5 spec paragraph) and b (`CommentStep`) are done. The commit step repeats location, service with duration, catalog price, barber and slot, plus "Payment on site", with "Confirm booking" under them. No promo field, no deposit figure, no pay button. Web booking 11 suites / 34 tests, `tsc --noEmit`, ESLint on changed files and `pnpm docs:validate` are green.

## Done

- [x] Slices a and b are `done`
- [x] "Confirm booking" sits under the service price and the slot
- [x] The step does not add a promo field or a payment button

## Risks

- [ ] **Pretending the catalog price is FinalPrice.** Label it as the service price. Discount lines arrive with T-090, on this same step, not as a second price
- [ ] **A deposit figure.** "Payment on site" stays until T-091 has taken a deposit. This task does not invent 30%

## Out of scope

- The running pin (T-4711). That trail has no price
- Promo validation (T-090c) and the charge (T-091)
- The success screen (T-4735)
