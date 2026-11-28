# T-092 · Checkbox: чеки депозиту і решти, верифікація

- **Stage**: M2 (phase 8) · **Tags**: backend, integration · **Complexity**: senior · **Depends on**: T-091
- **StoryPoints**: 8

## What

`FiscalGateway` (Checkbox): ланцюг передоплата/післяплата для депозиту+решти (чек #1 і #2), `ReceiptIssued` на статусі `DONE` (полінг), ідемпотентність через ID чека інтеграції; `FinalPrice = 0` ніколи не доходить до Checkbox (PAY-003/LYL-007); обмеження провайдера — з README `billing` (shift > 24 год, `sum_equals_total_sum`, тестова каса 100 чеків/міс).

## Sources

- `PAY-001…002` (чек = фактично сплачена сума); README `billing` §3 (верифікація провайдера); roadmap чеклист v1 (ПРРО)

## Done

- [ ] Чеки пробиваються на депозит і решту; ланцюг закривається
- [ ] Статуси чека і ретраї працюють; гейт PAY-001…002 виконаний

## Risks

- [ ] **Checkbox**: лимит 100 чеків/міс тестового — планувати запас
- [ ] **Зміни фіскального законодавства**: ЗІР-канали — верифікація фікс-датами


## Status

**2026-11-26 — лишається в `review`.** Відсутнє те саме, що й раніше: реальний Checkbox (фіскальні
чеки депозиту і решти), статуси й ретраї чека проти провайдера та гейт PAY-001…002. У коді є порт
`issueRefundReceipt` з fake-реалізацією в тестах — цього достатньо для юнітів, але не для закриття
пункту «чеки пробиваються». Потрібні бойові/пісочні ключі Checkbox.

## Re-verified at d92ff74d

Re-checked at `d92ff74d`: `apps/api/src/billing/infrastructure/checkbox-fiscal.gateway.ts` is an
in-memory map (`private receipts = new Map(...)`, `setShiftOpenedAt`), not a Checkbox HTTP client — no
`https://api.checkbox.ua`, no token, no polling. Its spec (4 cases) therefore proves the fake, not
PAY-001…002 against the provider. Closing needs sandbox credentials and a real client; both are
user-side.
