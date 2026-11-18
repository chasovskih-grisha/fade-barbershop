# T-090b · DiscountCalculator + AppliedDiscounts (4/12)

- **Stage**: M2 (phase 8) · **Tags**: backend, high-risk · **Complexity**: senior · **Depends on**: T-090a
- **StoryPoints**: 4

## What

Senior core of parent T-090: `DiscountCalculator` (client + slot + service + promo code → `AppliedDiscounts`), VIP + promo code stack with 30% cap (DSC-003), `FinalPrice` ≥ 0 (DSC-004). Monetary math in Decimal.

## Why

The only senior core of M2: edge cases (cap, stack, 100% discount, negative prices) — a bug here = direct financial losses.

## Sources

- ADR 0007 (discounts applied at booking)
- `DSC-001…004`; README `discounts`

## Done

- [ ] `DiscountCalculator` applies discounts at booking → `AppliedDiscounts`
- [ ] VIP + promo code stack with 30% cap (DSC-003) works
- [ ] `FinalPrice` ≥ 0 (DSC-004) in all cases
- [ ] Unit Tests for all DSC edge cases (cap, stack, 100%, negative)
- [ ] Math strictly in Decimal (no float)

## Risks

- [ ] **Decimal money**: float slips into calculation — review + lint rule

## dependencies

- T-090c (promo code field and deposit math)
