# T-4619b · The client sees the hold and the release

- **Stage**: M2 (phase 8) · **Tags**: frontend, billing · **Complexity**: middle · **Depends on**: T-4619a
- **StoryPoints**: 5

## What

Tell the client the chair is reserved only while they pay.

- The payment step shows the remaining time of the hold.
- If the hold expires on screen, the step stops offering pay and says the slot was released because payment was not taken. It links back into booking. It does not show a no-show warning and does not show a receipt.
- A successful capture replaces the countdown with the confirmed visit.
- The same states exist on the site and in the app. The app does not invent a second payment screen.
- Copy does not claim the card was charged when it was not.

## Why

A silent failure looks like a stolen slot or a stolen payment. The screen has to match the domain: either the visit is confirmed, or the chair is free and no money moved.

## Sources

- T-4619a
- `docs/acceptance-criteria/01-billing-payments.md` (PAY-WEB-05/06)
- `docs/client-screens.md` (visit that is waiting for a deposit)

## Done

- [ ] The countdown is visible on the payment step
- [ ] Expiry replaces pay with a release message and a way back to booking
- [ ] Confirmed payment removes the countdown
- [ ] Site and app share the states
- [ ] A test covers success, expiry, and a retry that starts a new hold

## Risks

- [ ] **Stale timer.** The deadline comes from `expiresAt` on the server. The client does not invent a 15-minute timer of its own

## Out of scope

- The sweeper — **T-4619a**
- Payment analytics — **T-4597**. This screen does not add an event name
