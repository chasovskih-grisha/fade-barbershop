# T-4737 · Cancelling a visit says what happens, and only what is known

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-032, T-091
- **StoryPoints**: 7

## What

`CancelVisitDialog` asks whether to cancel the date and the time. The cabinet spec says the dialog states the deposit rule: at or before the window the deposit returns, inside the window it is kept. The visit may not have a deposit at all, because the charge is still T-091.

The dialog names the visit as it does now. It adds a consequence only when the visit carries one. No deposit: no sentence about money. A deposit with a stored cancellation window: «Deposit will be returned» or «Deposit is retained», using that window, not a hardcoded four hours. A deposit with no stored window: do not invent the sentence. The dialog does not call a refund. T-091 moves the money.

## Why

A cancel button that never mentions the deposit will surprise the client the day a deposit exists, and a hardcoded four hours will be wrong the day the window is not four hours.

## Sources

- `apps/web/src/app/account/appointments/CancelVisitDialog.tsx`
- `docs/web-cabinet-screens.md` §3
- T-091

## Done

- [x] Slices a and b are `done`
- [x] A visit with no deposit gets no money sentence
- [x] A visit with a stored window shows return or kept, matching that window
- [x] Confirm still only cancels. It does not refund

## Risks

- [ ] **A default of four hours.** The number comes from the visit. If the field is absent, the dialog stays quiet about money
- [ ] **The refund.** This task does not call billing

## Out of scope

- The app visit list. It has no cancel control yet (T-4740)
- Reschedule (already on the website)
