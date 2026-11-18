# T-4542 · Online booking restrictions & protection rules

- **Stage**: M1 (phase 4) · **Tags**: backend, scheduling, business-rules · **Complexity**: middle · **Depends on**: T-040, T-041, T-053, T-4522
- **StoryPoints**: 5

## What

Конфігуровані обмеження онлайн-букінгу (на рівні локації/глобально):
- **Minimum booking lead time**: не раніше ніж X хвилин/годин (напр., 30 хв) — захист від "зараз же"
- **Maximum booking horizon**: не далі ніж Y днів (напр., 30 днів) — контроль календаря
- **Cancellation deadline**: онлайн-скасування не пізніше ніж Z годин до слоту (після — лише адмін/телефон)
- **Rescheduling deadline**: аналогічно
- **Deposit requirement**: обов'язковий депозит для онлайн-записів (або для нових клієнтів, або для конкретних послуг)
- **No-show protection**: клієнт з N no-show за останні M днів — блокування онлайн-запису (тільки через адміна)
- **Client booking limits**: макс. K активних записів онлайн на клієнта (запобігання дублюванню)
- **Prevent duplicate bookings**: той самий клієнт + той самий час/барбер = блокування
- **Existing-client recognition**: пошук за телефоном/email при старті флоу → презаповнення, показ активних записів
- **Guest booking**: опціонально дозволити без акаунту (тільки телефон + OTP)

## Why

Операційний контроль: уникнути no-show, дублювань, останньо-хвилинних записів які не встигає підготуватись.

## Sources

- T-040 (availability), T-041 (booking flow), T-053 (quick booking), T-4522 (slot policy), T-4421 (daily booking limit)
- Altegio: limity rezerwacji online, depozyty, blokady dla no-show, horyzont rezerwacji

## Done

- [ ] Конфіг `OnlineBookingPolicy` в DB (на локацію, з глобальним дефолтом)
- [ ] Валідація в use cases: `bookAppointment`, `quickBook`, `rescheduleAppointment`
- [ ] API: `GET /booking/policy` для фронту (показ причин блокування)
- [ ] UI: повідомлення "Запис онлайн можливий не раніше ніж за 30 хв", "Макс. 2 активні записи"
- [ ] Guest booking toggle в адмінці локації

## Risks

- [ ] **Конфлікт політик**: deposit policy (T-4444) + online booking policy — уніфікувати в `BookingRules` (T-4522)
- [ ] **Guest booking + OTP**: потрібен T-010 (OTP) до завершення флоу

## Implementation notes

- apps/api/prisma/migrations/20261219000000_add_online_booking_policy/migration.sql
- apps/api/prisma/schema.prisma
- apps/api/src/booking/policy/booking-policy.controller.ts
- apps/api/src/booking/policy/booking-policy.module.ts
- apps/api/src/booking/policy/booking-policy.ports.ts
- apps/api/src/booking/policy/evaluate-online-booking.create.ts
- apps/api/src/booking/policy/evaluate-online-booking.fakes.ts
- apps/api/src/booking/policy/evaluate-online-booking.spec.ts
- apps/api/src/booking/policy/evaluate-online-booking.ts
- apps/api/src/booking/policy/online-booking-policy.ts
- apps/api/src/booking/policy/policy-rules.spec.ts
- apps/api/src/booking/policy/policy-rules.ts
- apps/api/src/booking/policy/prisma-booking-policy.store.ts
- apps/api/src/scheduling/infrastructure/admin-bookings.providers.ts
- apps/api/src/scheduling/infrastructure/client-bookings.deps.ts
- apps/api/src/scheduling/infrastructure/client-bookings.providers.ts
- apps/api/src/scheduling/infrastructure/client-online-policy.ts
- apps/api/src/scheduling/infrastructure/reference-photo.providers.ts
- apps/api/src/scheduling/scheduling.module.ts

## Scope notes

Конфіг — таблиця `OnlineBookingPolicy` (рядок локації + глобальний `locationId = null`),
чим закрито Done «конфіг в DB». Валідація: `EvaluateOnlineBooking` у
`ClientBookingsController` (клієнтський book) до резервації слота; той самий
`POST /booking/policy/evaluate` віддає причини для cancel/reschedule у флоу
скасування й перенесення. Адмінський запис (телефон/walk-in) політику свідомо
не проходить — це офлайн-канал. Провайдери SchedulingModule винесені в окремі
файли (`client-bookings.*`, `admin-bookings.providers`, `reference-photo.providers`),
бо модуль уже на межі `max-lines`. UI-повідомлення (Done-пункт 4) і перемикач
guest booking в адмінці — фронтенд-лейн; тексти причин віддаються з
`blocks[].message`, щоб UI їх не дублював. Депозит лишається в T-4444
(`BookingRules`-уніфікація не входила).

## Implementation plan

Paths:
- apps/api/src/booking/policy/online-booking-policy.ts
- apps/api/src/booking/policy/policy-rules.ts
- apps/api/src/booking/policy/policy-rules.spec.ts
- apps/api/src/booking/policy/evaluate-online-booking.spec.ts

Checks:
- `pnpm --filter @fade/api exec jest apps/api/src/booking/policy/policy-rules.spec.ts apps/api/src/booking/policy/evaluate-online-booking.spec.ts`

## QA

- `pnpm --filter @fade/api exec jest apps/api/src/booking/policy/policy-rules.spec.ts apps/api/src/booking/policy/evaluate-online-booking.spec.ts` exit 0
