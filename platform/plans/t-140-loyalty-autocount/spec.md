# T-140 spec

## Прийнятні критерії
- Подія `LoyaltyVisitsIncremented` існує і експортується з `loyalty-events.ts`.
- `IncrementLoyaltyVisitsHandler` існує і експортується з `increment-loyalty-visits.use-case.ts`.
- Юніт-спе покривають: інкремент лічильника, викид події, невідомий клієнт → `ClientProfileNotFoundError`.
- Ідемпотентність за `appointmentId` зафіксована в README плану.

## Бази
- `crmHandlersSetup()` — `apps/api/src/crm/application/crm-handlers-setup.ts`
- `crmTestingModule()` — `apps/api/src/crm/e2e/admin-clients.fakes.ts`
- Приклад проєкції — `apps/api/src/scheduling/infrastructure/appointment-activity.projection.ts`

## Что не входить
- Релей outbox і підписка на `scheduling.appointment.completed` — окремі задачі (T-042c / T-140 релей).
- Кесування 7-го візиту — окрема задача; тут лише інкремент лічильника.
