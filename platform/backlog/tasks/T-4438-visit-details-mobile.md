# T-4438 · Mobile Visit Details (Receipts, Certificates)

- **Stage**: M2 (phase 5) · **Tags**: mobile, frontend · **Complexity**: junior · **Depends on**: T-071, T-4434
- **StoryPoints**: 3

## What

App items screen: details of a completed visit (services, cost, discounts, stylist, T-4437 photo if confirmed), receipt (T-4434) as a document, certificates/balances (clarification: issuing from T-210, displaying certificate).

## Why

Visit history on mobile (T-071) requires details; without this screen, the client cannot see the breakdown of the check total or repeat the booking (T-4471 re-booking).

## Sources

- client-screens.md §4-5; T-071; billing README (receipt)

## Done

- [ ] Visit details in iOS/Android: services + amount + photo (if confirmed)
- [ ] Receipt opens from visit screen (re-fetching)
- [ ] Certificate/balance from T-210 displayed as a badge

## Risks

- [ ] **Amount regression**: amount from read model T-071 — do not recalculate from scratch (Booking attack)
