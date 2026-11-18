# T-140 checklist

## Артефакти плану
- [x] `plans/t-140-loyalty-autocount/README.md`
- [x] `plans/t-140-loyalty-autocount/steps.md`
- [x] `plans/t-140-loyalty-autocount/spec.md`
- [x] `plans/t-140-loyalty-autocount/context.md`
- [x] `plans/t-140-loyalty-autocount/ledger.md`
- [x] `plans/t-140-loyalty-autocount/repro.diff`
- [x] `plans/t-140-loyalty-autocount/repro/*.spec.ts`
- [x] `plans/t-140-loyalty-autocount/checklist.md`

## Артефакти реалізації (ще не створено)
- [ ] `apps/api/src/crm/application/increment-loyalty-visits.use-case.ts`
- [ ] `apps/api/src/crm/domain/loyalty-events.ts` — доповнено про `LoyaltyVisitsIncremented`
- [ ] юніт-спе на `IncrementLoyaltyVisitsHandler`

## Базові файли, які використовуються планом
- [x] `apps/api/src/crm/application/crm-handlers-setup.ts`
- [x] `apps/api/src/crm/e2e/admin-clients.fakes.ts`
- [x] `apps/api/src/scheduling/infrastructure/appointment-activity.projection.ts`

## Примітки
- Репродивні копії спекувань збережено так, щоб diff був самодостатнім.
- Базові файли не змінюються планом — вони лише читаються.
- Контекст-файл і чекліст оновлено після створення плану.
