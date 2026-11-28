# T-4549 · Payments: Split, Gift Card, Membership, Loyalty, Tip, Multi-Method, Receipts

- **Stage**: M2 (phase 8) · **Tags**: backend, billing · **Complexity**: senior · **Depends on**: T-090, T-091, T-092, T-093, T-094, T-210, T-211, T-3901, T-140, T-4212
- **StoryPoints**: 13

## What

Complete visit payment lifecycle (extension of T-090/091/092/093/094):
- **Payment methods**: CASH, CARD, SPLIT (split payment across methods), GIFT_CARD (T-210), MEMBERSHIP, LOYALTY (free visit T-141), TIP (T-4212).
- **Multi-method checkout**: combining gift card + cash, or split bill between clients.
- **Receipts**: fiscal printer integration (Checkbox T-092) with correct split items and tax groups.
- **Refunds & adjustments**: partial refunds, tip adjustment, administrative overrides.

## Why

Real barbershop transactions are complex; single-method cash/card is insufficient for subscriptions, tips, and gift cards.

## Sources

- Billing architecture; Checkbox API; T-090…094

## Done

- [ ] Multi-method payment engine backend support
- [ ] Frontend payment modal supporting split, tips, and certificates
- [ ] Fiscal receipt generation for combined payments
- [ ] Comprehensive unit and integration tests

## Risks

- [ ] **Fiscal compliance**: complex split payments must generate legally valid fiscal receipts without rounding discrepancy errors.
