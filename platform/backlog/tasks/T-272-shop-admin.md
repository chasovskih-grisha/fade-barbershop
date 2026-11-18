# T-272 · Shop Admin: products, reserves, orders

- **Stage**: M5 · **Tags**: frontend · **Complexity**: middle · **Depends on**: T-270, T-271
- **StoryPoints**: 5

## What

`admin-screens.md` §15: products (list/form/variants/stock — SHOP-ADM-01), shop-lite reserves by location with "Issued" (SHOP-ADM-03), orders (list/card/statuses/track/refund — SHOP-ADM-02, phase 27), settings (deadline, delivery, "full shop" toggle — SHOP-ADM-04), performance (SHOP-ADM-05: revenue/day, booking conversion, AOV, sales by recommending barber).

## Sources

- `SHOP-ADM-01…05`; `admin-screens.md` §15 (matrix: barber — reserves only)

## Done

- [ ] All §15 screens work

## Risks

- [ ] **Migrations**: schema changes break existing data — migration with backfill plan
- [ ] **Domain events**: subscriptions are idempotent (ADR 0009/0016 pattern)

