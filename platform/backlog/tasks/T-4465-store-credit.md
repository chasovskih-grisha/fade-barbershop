# T-4465 · Store Credit

- **Stage**: M5 (phase 10) · **Tags**: backend, finance, high-risk · **Complexity**: senior · **Depends on**: T-094, T-152
- **StoryPoints**: 8

## What

`StoreCredit` — client monetary balance on account: accruals (refund for guessed/promo, compensation), write-offs (services, shop), operation log with bookingId, validity period for promo credit, write-off limit (max 100% of position, part of cash register). Integration with T-094 (payments) and derived receipt coverage.

## Why

Refund of guessed cancellation — "once again", promo up to 50% — tracked via amounts rather than one-off discounts (T-030). Credit is CLT-01 operational flexibility (major OAS).

## Sources

- billing README; T-094 (payments), T-152 (promo); financial return logic; open decision on promo balances

## Done

- [ ] Accrual/write-off/balance with log and limits (% of position)
- [ ] Receipt coverage "credit + remainder"; return to credit upon cancellation
- [ ] Validity period of promo credit; test full usage upon return

## Risks

- [ ] **Double counting**: credit does not stack with discount on the same position (point rule in test)
