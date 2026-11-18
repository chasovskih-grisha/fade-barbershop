# T-141 · Безкоштовний візит: право, FinalPrice 0, без чека

- **Stage**: M4 (phase 11B) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-090, T-140
- **StoryPoints**: 5

## What

Частина B: запис 7-го візиту → перевірка права → `FreeVisitApplied` → `FinalPrice = 0` (LYL-004) → **без `Payment` і без чека** (PAY-003 + інваріант billing README); підтвердження одразу при записі; завершення → `FreeVisitUsed`, counter = 0; право зберігається при скасуванні (LYL-005/006). Облік для бухгалтера — AC 05 (LYL-007).

## Sources

- `LYL-003…007`; **ADR 0009 §2**; README `billing` (ComplimentaryVisit)

## Done

- [ ] 7-й візит проходить без оплати і чека; лічильник скидається
- [ ] Гонки з скасуванням покриті тестами

## Risks

- [ ] **Безкоштовний візит без чека** (LYL-007, Закон №265): фіскалізація через `full_discount_promo` — PAY-003/DSC-013

