# T-4537 · Composite appointments: multiple services, multiple barbers, packages

- **Stage**: M1 (phase 4) · **Tags**: backend, scheduling, catalog, high-risk · **Complexity**: senior · **Depends on**: T-4520, T-4521, T-4520a, T-4520b
- **StoryPoints**: 13

## What

Повна підтримка складених записів (T-4520 — композитний слот) для реальних сценаріїв:
- **Multiple services in one appointment**: клієнт обирає "Стрижка + Борем" — один слот, сума тривалостей, сума цін, один депозит
- **Different barber per service**: стрижка — барбер А, борода — барбер Б (послідовно або паралельно залежно від крісел)
- **Multiple barbers for one service**: "батько + син" (T-044) розширено на довільну групу послуг
- **Packages/bundles**: попередньо налаштовані набори послуг з фіксованою ціною/тривалістю (наприклад, "Complex Grooming")
- **Add-on services**: додаткові послуги під час візиту (наприклад, "farba на бороду" додана барбером після старту)
- **Changing services/barber after booking**: reschedule з зміною складу послуг/барберів (T-4533)
- **Appointment duplication / repeat booking**: "записати так само" (клонування композиції)

## Why

Реальні кейси барбершопу: комплексні послуги, командна робота, пакети. Без цього — обхідні шляхи (кілька записів) що ламають інваріант крісел і аналітику.

## Sources

- T-4520 (composed slot), T-4521 (barber-service matrix), T-4522 (slot policy), T-044 (appointment party)
- Altegio: pakiety usług, wiele usług w jednej wizycie, różni fryzjerzy, dodatki w trakcie wizyty

## Done

- [ ] Домен: `Appointment` містить `positions: AppointmentPosition[]` (service, barber, duration, price, status)
- [ ] Валідація: сума тривалостей ≤ слот, наявність барберів у вільні слоти, матриця спеціалізацій (T-4521)
- [ ] Booking flow (web/mobile): multi-select послуг, автовибір "any barber" або ручний по послугах
- [ ] Адмінка: картка композитного запису — редагування позицій, зміна барбера/послуги по позиції
- [ ] Барбер mobile: вкладка "Послуги" в картці візиту, можливість Add add-on (T-083)
- [ ] Депозит: 30% від сумарної ціни (T-091), чек на повну суму
- [ ] Loyalty: лічильник +1 за візит (не за кількість послуг) (T-140)
- [ ] Клонування: "Повторити цей візит" — копіює композицію в новий чернетку

## Risks

- [ ] **Конкурентність**: блокування кількох барберів/крісел атомарно (T-040c)
- [ ] **Часткове скасування**: клієнт відмовився від однієї послуги — перерахунок ціни/депозиту/тривалості
- [ ] **Часткове завершення**: барбер А закінчив, барбер Б ще працює — статус запису?