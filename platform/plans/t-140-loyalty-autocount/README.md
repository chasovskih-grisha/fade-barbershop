# T-140 · Автоінкремент лояльності по події завершеного візиту

- **Етап**: M3 (фаза 14) · **Теги**: backend, crm, events · **Складність**: junior · **Залежності**: T-060, T-061
- **StoryPoints**: 3

## Що
Підписник на `scheduling.appointment.completed`, який інкрементує `ClientProfile.loyaltyVisitsCount` і викидає подію `crm.loyalty.visits_incremented`. Ідемпотентний за `appointmentId`, патерн ADR 0009 (журнал оброблених подій у тій самій транзакції).

## Реалізація
- `IncrementLoyaltyVisitsHandler` у `apps/api/src/crm/application/increment-loyalty-visits.use-case.ts`
- Подія `LoyaltyVisitsIncremented` у `apps/api/src/crm/domain/loyalty-events.ts`
- Юніт-спе на інкремент і подію, невідомий клієнт → `ClientProfileNotFoundError`

## Бази
- Юніти crm: `crmHandlersSetup()` у `apps/api/src/crm/application/crm-handlers-setup.ts`
- E2E crm: `crmTestingModule()` у `apps/api/src/crm/e2e/admin-clients.fakes.ts`
- Приклад проєкції на подіях: `AppointmentActivityProjection` у `apps/api/src/scheduling/infrastructure/appointment-activity.projection.ts`

## Примітки
- Ідемпотентність — по `appointmentId`, бо один клієнт має багато візитів.
- `LoyaltyVisitsIncremented` окрема від `LoyaltyVisitsChanged` — авто-нарахування vs ручна зміна адміном.
