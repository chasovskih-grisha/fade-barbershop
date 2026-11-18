# T-4711 · Pinned booking summary

- **Stage**: M1 (phase 4) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-041
- **StoryPoints**: 7

## What

While a client is still choosing, the decisions already made stay pinned at the top of the booking flow: location, service, barber, and time. Each earlier decision is a way back to that step. The pin is a running trail, not the payment receipt.

The slot grid is long. Today the only record of "where, what, and who" is the screens the client has left. This epic keeps that record on screen.

## Why

A client who is picking a time should not have to remember the location, the service, or the barber, and should not have to walk the whole flow backwards to change one of them. Screen 5 already repeats the visit as a receipt. The gap is the steps before that.

## Sources

- `docs/booking-flow.md` (screens 0–5; screen 5 is the receipt and stays the receipt)
- `docs/design-system.md` (tokens, sticky regions, uk-UA time, ₴, focus-visible)
- T-041

## Done

- [ ] Slices a and b are `done`
- [ ] On the slot step the client sees location, service, and barber without scrolling, and the chosen time stays visible while the grid scrolls
- [ ] Changing one earlier fact uses the same step change as Back. The pin does not keep a fact the flow has cleared

## Risks

- [ ] **The pin eats the grid.** The site header, the concierge banner, and a tall summary leave no room for the date strip on a phone. The banner leaves once a decision exists, and the pin stays within two lines
- [ ] **A stale fact.** The pin renders the flow state. It does not keep its own copy. An empty barber id before the barber step is "not chosen", not "any barber"
- [ ] **Two summaries.** Screen 5 keeps the receipt, the reference, the comment, and the price breakdown. The pin does not grow a second total

## Out of scope

- Admin phone booking. That is an operator form, not this trail
- The embeddable widget (T-4541, T-053ax)
- The mobile app. T-071 builds those screens later and should follow the same contract from slice a
- Promo codes, deposit, and `FinalPrice`. Those stay on screen 5
- Restyling the step-0 concierge banner
