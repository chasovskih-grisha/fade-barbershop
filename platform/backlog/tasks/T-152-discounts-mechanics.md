# T-152 · Промокоди + правила + VIP, застосування при записі

- **Stage**: M4 (phase 13; B-слайс «перший візит» — v1 за рішенням) · **Tags**: backend, high-risk · **Complexity**: senior · **Depends on**: T-090 (калькулятор у фазі 8), T-060
- **StoryPoints**: 8

## What

Модель `discounts`: PromoCode (нечутливий до регістру, ліміти, термін), DiscountRule (перший візит — DSC-RULE-01, непікові години), ClientDiscountLevel (VIP на картці клієнта); реюз `DiscountCalculator` з T-090; referral-тип — phase 21 (ADR 0014). Правила валідності (DSC-RULE-01…03), VIP+промокод з капом (DSC-003 — механіка вже в T-090), 100% код → FinalPrice 0 без чека, причина `full_discount_promo` (DSC-013).

## Sources

- `DSC-001…006`, `DSC-013`, `DSC-RULE/VIP/WEB/MOB`; **ADR 0007**; discounts README

## Done

- [ ] Три типи знижок працюють через один калькулятор
- [ ] DSC-013 (0-грн від 100% коду) — без Payment і чека
