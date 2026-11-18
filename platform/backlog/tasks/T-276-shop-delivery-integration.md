# T-276 · Shop: delivery, referencing, recommender

- **Stage**: M5 (phase 27, slice 3 of 3) · **Tags**: backend, integration · **Complexity**: middle · **Depends on**: T-274, T-275, T-080
- **StoryPoints**: 5

## What

Nova Poshta: API TTN creation, tracking number in order and cabinet, `shipped` status (SHOP-023, SHOP-ADM-02); push/email about statuses (SHOP-004); **integration with booking**: "Recommend product" in visit card (barber/admin), "Book now" CTA after purchase, "Orders" section in client CRM card (LTV = visits + purchases); shop metrics in dashboard (SHOP-ADM-05: AOV, conversion, sales by recommending barber).

## Sources

- `SHOP-023, SHOP-004, SHOP-ADM-02/05`; `docs/online-shop.md` (booking integration — "most valuable part")

## Done

- [ ] TTN is created and tracked; statuses are sent
- [ ] Orders are visible in CRM; recommender works from visit card

## Risks

- [ ] **Nova Poshta API**: TTN statuses; delivery zone — open decision #7

