# T-273 · Full Online Shop: Cart, Checkout, Nova Poshta, Receipts

- **Stage**: M5 (phase 27) · **Tags**: frontend · **Complexity**: — · **Depends on**: T-272, T-091 (acquiring), T-080

## What

SHOP-020…026 + SHOP-WEB/ACC: product catalog and card (SHOP-WEB-01), shopping cart (SHOP-WEB-02), checkout — OTP login, Nova Poshta address / pickup, card payment via booking acquiring (type `order`; idempotency and 'money not captured' — PAY semantics), stock re-validation on payment (SHOP-020); statuses `new → paid → packing → shipped | ready_pickup → completed`; remote e-commerce PRRO receipt (SHOP-024 — verify before launch); cancellations/returns (SHOP-025); shop discounts — custom logic, not DSC-* (SHOP-026); 'My Orders' and 'Delivery Address' in `/account` (SHOP-ACC-01…03); CTA 'Book Now' after purchase.

## Sources

- `SHOP-020…026`, `SHOP-WEB-01…04`, `SHOP-ACC-01…03`; `docs/online-shop.md` (phase 27, loyalty boundaries)

## Done

- [ ] End-to-end purchase with delivery and fiscal receipt
- [ ] Service loyalty unaffected (Tests)

## Risks

- [ ] **Migrations**: schema changes break existing data — migration with backfill plan
- [ ] **Domain events**: subscriptions idempotent (ADR 0009/0016 pattern)
