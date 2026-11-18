# T-090a · Price Snapshot (Core) (4/12)

- **Stage**: M2 (phase 8) · **Tags**: backend, high-risk · **Complexity**: middle · **Depends on**: T-042
- **StoryPoints**: 4

## What
Price snapshot on booking: `AgreedPrice` from location catalog; breakdown into base price and discounts. Without promo code.

## Why
Main booking flow — without promo code and loyalty. Promo code is a separate slice.

## Sources
- ADR 0006 (price snapshot)
- `DSC-001` (price breakdown)

## Done
- [ ] Price snapshot works
- [ ] Price breakdown without discounts

## dependencies
- T-090b (promo code and discounts)