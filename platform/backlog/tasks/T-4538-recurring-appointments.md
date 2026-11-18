# T-4538 · Recurring appointments (regular bookings)

- **Stage**: M4 (phase 16+) · **Tags**: backend, scheduling, experimental · **Complexity**: senior · **Depends on**: T-042, T-4537, T-4522
- **StoryPoints**: 13

## What

Регулярні записи: клієнт обирає "кожен вівторок о 18:00 на 8 тижнів". Система:
- Генерує серію записів заздалегідь (горизонт: 4-12 тижнів, конфігурується)
- Автоматично розширює серію при наближенні горизонту (background job)
- Обробляє винятки: відпустка барбера, свята, клієнт скасував один раз — решта серії зберігається
- Підтримує "skip this occurrence" (пропустити цей раз) та "modify series" (змінити час/барбера для всіх майбутніх)
- Депозит: або на кожен запис окремо, або преавторизація на серію (налаштування)
- Пов'язані з `AppointmentSeries` агрегатом,source = `RECURRING`

## Why

Постійні клієнти (тижнева стрижка, щомісячна борода) — основа стабільного навантаження. Altegio має "cykliczne rezerwacje".

## Sources

- T-042 (lifecycle), T-4537 (composite), T-4522 (slot policy), T-4414 (workday exceptions)
- Altegio: rezerwacje cykliczne, seria wizyt

## Done

- [ ] Домен: `AppointmentSeries` (pattern: RRULE-like, startDate, endDate, exceptions[], appointments[])
- [ ] Use case: `CreateRecurringBooking`, `ModifySeries`, `CancelOccurrence`, `ExtendHorizon`
- [ ] Background job: щоденний розширінь горизонту (T-4414 exceptions враховуються)
- [ ] Адмінка: вкладка "Серії" в календарі, bulk-дії з серією
- [ ] Клієнт: перегляд своєї серії в кабінеті, скасування одного/всіх
- [ ] Барбер: видить серію в своєму календарі (спеціальна позначка)
- [ ] Депозит: опція "per occurrence" vs "series preauth" (налаштування локації)

## Risks

- [ ] **complexity RRULE**: початкова версія — лише weekly/biweekly з фіксованим днем, без складних правил
- [ ] **Конфлікти при розширенні**: слот зайнятий — запропонувати альтернативу клієнту/адміну
- [ ] **Депозити**: множинні преавторизації можуть блокувати великі суми на картці клієнта