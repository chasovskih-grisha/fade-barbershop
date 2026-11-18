# Політика онлайн-букінгу (T-4542)

Обмеження, які застосовуються до клієнтського шляху запису; адмінський
запис (телефон, walk-in) їх свідомо не проходить.

| Поле | Типово | Що обмежує |
|------|--------|-----------|
| `minLeadMinutes` | 60 | не раніше ніж за N хв до старту |
| `maxHorizonDays` | 30 | не далі ніж за N днів уперед |
| `cancellationDeadlineHours` | 12 | онлайн-скасування до N год до старту |
| `rescheduleDeadlineHours` | 12 | онлайн-перенесення до N год |
| `maxActiveBookings` | 2 | активних записів на клієнта |
| `allowGuestBooking` | true | запис без акаунта |
| `noShowBlock` | 3 / 180 днів | блокування після N неявок за вікно |

- **Конфіг**: таблиця `OnlineBookingPolicy` — рядок на локацію, `locationId = null`
  задає глобальний дефолт. `PUT /admin/settings/online-booking-policy?locationId=…`
  (глобальний — без query). Охороняє `AdminSessionGuard` як інші `/admin/*`.
- **Читання**: `GET /booking/policy?locationId=…` — ефективна політика для фронту.
- **Перевірка**: `POST /booking/policy/evaluate` `{locationId, action: create|cancel|reschedule, start, barberId?, clientId?}`
  → `{allowed, policy, blocks[{code, message}]}`; той самий `EvaluateOnlineBooking`
  викликає `ClientBookingsController` до резервації слота, відмова → 409
  `{code: 'BOOKING_BLOCKED', blocks}`.
- **Дані для правил**: активні записи (`end >= now`, статус не cancelled/completed/
  no_show/expired), дублікат (той самий клієнт+барбер+start), no-show за вікно.
- **Runbook**: (1) `pnpm --filter api db:migrate` — таблиця нова;
  (2) задати глобальну політику `PUT …/online-booking-policy` без `locationId`;
  (3) перевірити `GET /booking/policy?locationId=…` і передполітну відмову
  `POST /booking/policy/evaluate` (наприклад, слот за 10 хв → `min_lead_time`);
  (4) якщо фронт показує причини — брати тексти з `blocks[].message`, не
  дублювати у верстці.
