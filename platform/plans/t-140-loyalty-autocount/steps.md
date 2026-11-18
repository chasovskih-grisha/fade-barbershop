# T-140 steps

1. Додати подію `LoyaltyVisitsIncremented` до `apps/api/src/crm/domain/loyalty-events.ts`.
2. Додати use case `IncrementLoyaltyVisitsHandler` до `apps/api/src/crm/application/increment-loyalty-visits.use-case.ts`.
   - Приймає `appointmentId`, `clientId`, `occurredAt`.
   - Інкрементує `ClientProfile.loyaltyVisitsCount`.
   - Пише подію `LoyaltyVisitsIncremented`.
   - Невідомий клієнт → `ClientProfileNotFoundError`.
3. Написати юніт-спе на інкремент, подію і невідомий клієнт.
4. Використати `crmHandlersSetup()` з `apps/api/src/crm/application/crm-handlers-setup.ts` для фейків.

## Перевірки
- Юніт-спе проходять.
- `pnpm check` проходить.
- Файли не ламають існуючі імпорти (немає циклів, немає нових експортів поза `increment-loyalty-visits.use-case.ts` і `loyalty-events.ts`).
