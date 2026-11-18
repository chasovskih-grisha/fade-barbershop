# T-4736a · Specify the price on the commit step

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4736
- **StoryPoints**: 2

## What

Add a paragraph to screen 5 in `docs/booking-flow.md`, ahead of the discount lines.

Until `FinalPrice` exists, the commit step shows the chosen service's catalog price, duration, location, barber, and slot, then «Оплата на місці». The comment field stays. The button stays «Підтвердити запис». Promo entry and the deposit rows are unchanged and still belong to T-090 and T-091. They are not drawn as zeros.

## Why

Screen 5 currently assumes the payment panel. The step that is live has neither the panel nor the price.

## Sources

- T-4736
- `docs/booking-flow.md`

## Status

**Done** (2026-11-12): screen 5 of `docs/booking-flow.md` now has a «Крок підтвердження до FinalPrice (T-4736)» block ahead of the discount rows. It names the facts shown (location, service with duration, barber, slot), the catalog `N ₴` price as not-`FinalPrice`, «Оплата на місці», and states that promo/deposit/payment controls are not drawn. The existing FinalPrice, discount and deposit rows are unchanged, and the block says the catalog line becomes the base row when T-090 lands. `pnpm docs:validate` green.

## Done

- [x] The paragraph names the catalog price and «Оплата на місці»
- [x] It does not replace the later discount and deposit rows
- [x] `pnpm docs:validate` reports no new error from this file

## Risks

- [ ] **Two prices.** When T-090 lands, the catalog line becomes the base row of that breakdown. This paragraph says so
