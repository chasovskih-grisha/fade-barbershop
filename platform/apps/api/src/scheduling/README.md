# Календар і записи (`scheduling`)

> Тип піддомену: **Core**

Система правди для візитів. Слоти, доступність барбера, підтвердження / скасування / перенесення. Пакет «Батько + син» — агрегат `AppointmentParty` (ADR 0011), не два соло-записи.

## Ubiquitous language

- **Appointment** — запис **однієї** людини до барбера на крісло.
- **AppointmentParty** — пакет на двох (`father-son`): одна транзакція, одна ціна, дві `PartyLeg`.
- **PartyLeg** — нога партії (батько або син): барбер, крісло, тривалість, опційний референс.
- **FulfillmentMode** — `sequential` (черга, 90 хв) або `parallel` (два крісла, 50 хв).
- **Availability** — коли барбер може приймати.
- **TimeSlot** — атомний проміжок у календарі.
- **HaircutReference** — зображення бажаної зачіски (ID із `haircut-ai` або завантажене фото), опціональне; у партії — на ногу.
- **AppointmentComment** — текстовий коментар клієнта до візиту (≤ 500 символів), опціональний.
- **CompanionName** — ім’я сина на нозі `son` (без акаунта в v1).
- **WaitlistEntry** — заявка в листі очікування: конфігурація (локація + послуга + барбер/«Будь-який»), вікно дат, точність часу; механіка — ADR 0012.
- **SlotHold** — утримання звільненого слота на 15 хв під час пропозиції черзі; не бронь, конвертується в `Appointment` лише явним підтвердженням.

## Aggregates (план, ще не код)

- `Appointment` (з `AgreedPrice` — ADR 0006, опціональними `HaircutReferenceId`, `AppointmentComment`)
- `AppointmentParty` (ADR 0011; `AgreedPrice` на партії; дві `PartyLeg`)
- `BarberSchedule`

## Domain events (план)

- `AppointmentBooked` (несе `HaircutReferenceId?`, `AppointmentComment?`)
- `AppointmentPartyBooked` (несе режим, ноги, `AgreedPrice`)
- `AppointmentConfirmed`
- `AppointmentRescheduled`
- `AppointmentCancelled`
- `AppointmentCompleted`
- `AppointmentPartyCompleted` (обидві ноги `complete`)
- `AppointmentNoShowed` (потрібна для KPI `analytics`, ANL-004)
- `HaircutReferenceChanged`
- `WaitlistEntryAdded` / `WaitlistEntryClosed`
- `SlotOffered` (першому в черзі, з hold 15 хв) / `SlotOfferDeclined` / `SlotOfferExpired`
- `SlotFilledFromWaitlist` (підтвердження → звичайний `Appointment`)
- `AvailabilityChanged` (джерело: `barber` self-service або `admin`; аудит змін графіка, SCH-008)

## Життєвий цикл Appointment (візит + оплата)

Два паралельні треки: **статус візиту** веде `scheduling`, **статус оплати** живе на `Appointment`, але переходи його запускають події `billing` (`PaymentCaptured` / `PaymentRefunded`) — `scheduling` ніколи не пише суми, лише відображає стан (PAY-004).

```
Візит:   booked ──→ confirmed ──→ in_progress ──→ completed
            │             │
            │             └──→ no_show
            └──→ cancelled

Оплата:  Очікує депозиту → Депозит сплачено → Очікує решти → Оплачено
```

Точки синхронізації:

- **booked → confirmed**: перехід відкриває оплата депозита (`PaymentCaptured` на 30% `FinalPrice`, PAY-WEB-02: «Підтверджено (депозит сплачено)»); без успішного депозита візит лишається «Очікує депозиту» і не підтверджений.
- **`FinalPrice = 0` (ComplimentaryVisit)**: депозита немає за побудовою (PAY-003) — візит підтверджується **одразу при записі**, трек оплати пропускається до «Оплачено» (0 грн, причина `loyalty` / `full_discount_promo`).
- **walk-in**: створюється одразу в статусі `booked` з активним «Почати» (WALK-BAR-02), без депозита; решта — на місці після послуги (§1.3 `barber-screens.md`).
- **in_progress → completed**: дія барбера; подія `AppointmentCompleted` розблоковує відгук, лояльність, push вибору каналу. Оплата в цей момент зазвичай «Очікує решти» → «Оплачено» після позначки решти (POS/готівка, PAY-ADM-07).
- **no_show**: депозит **утримується** — перехід оплати не відбувається (гроші вже захоплені); зняття no-show адміном запускає refund (NSH-ADM-03 → PAY-005б).
- **cancelled**: депозит повертається (≥ 4 год, автоматично — `PaymentRefunded`, стани «Депозит повертається… → Депозит повернено») або утримується (пізнє); гонка cancel ↔ no-show — PAY-008.
- **Статуси візиту не відкочуються** (помилка — через адміна в календарі мережі, `barber-screens.md` §4.2); скасування/перенесення — клієнт або адмін, не барбер.

## Конкурентність і інваріант крісел (T-040c)

- **Механізм — serializable-транзакція Prisma** (`isolationLevel: 'Serializable'`) навколо читання зайнятості й вставки `Booking`: `PrismaBookingRepository.save` і party-варіант `PrismaAppointmentPartyRepository.save`. Із альтернатив (SELECT FOR UPDATE vs optimistic locking з retry) обрано serializable: транзакції короткі (2 читання + 1 insert), без ручних блокувань; конфлікт ізоляції `P2034` мапиться в `BookingConflictError` → HTTP 409 з підказкою «оновіть слоти і повторіть».
- **Валідатор не є захистом**: `SlotValidator`/`hasChairCapacity` — fast-fail для користувача; інваріант «активні крісла − перетини» остаточно вирішується всередині транзакції. Два одночасні запити за останнє крісло: рівно один 201, інший 409 (e2e `scheduling/e2e/admin-bookings.e2e.spec.ts`, `appointment-party/e2e/appointment-party-race.e2e.spec.ts`).
- **Партія атомарна (ADR 0011)**: `AppointmentParty` і її `Booking`-рядки (обидві ноги) пишуться в одній serializable-транзакції; конфлікт будь-якої ноги відкочує всю партію — не буває партії з однією ногою (PARTY-007).
- Повторні запити після 409 — на відповідальності клієнта (повторний POST після оновлення слотів); сервер не ретраїть автоматично.

## Життєвий цикл Appointment — реалізація (T-042, 2026-09-25)

- **Агрегат** `Appointment` (`domain/appointment.aggregate.ts`) живе на рядку `Booking` (колонки `appointmentId/status/cancelReason`) — статус і слот одна сутність БД. Переходи за ADT-моделлю: `booked → confirmed → in_progress → completed` + бічні `cancelled`/`no_show`; `reschedule` міняє час у будь-якому живому статусі. Заборонені переходи кидають `InvalidTransitionError` (HTTP 409); скасування/перенесення — клієнт або адмін (барберу 400).
- **Події** `scheduling.appointment.*` (`domain/appointment.events.ts`) пишуться в outbox тією ж транзакцією, що й статус (`PrismaAppointmentRepository.save`). Команди: `AppointmentLifecycle` (confirm/start/complete/markNoShow/cancel/reschedule) через `POST /admin/appointments/:id/*`.
- **Еталон ідемпотентного підписника (T-042c)** — `AppointmentActivityProjection`: журнал оброблених (`AppointmentActivity.eventId` UNIQUE) + ефект **в одній транзакції релея** — повторна доставка не дублює ефектів (duplicate), збій відкочує все разом. Чужі події — ignored. Цей патерн копіюють T-140 (лояльність), T-150 (відгуки), T-170 (waitlist), T-110 (аналітика).
- **Моніторинг відставання релея**: `OutboxLagProbe.lag()` → `{pending, oldestPendingMs}` по `OutboxMessage.publishedAt IS NULL`; метрика в `/health` додається на старті T-4204.

## Недоступність барбера (T-4616 / T-4447, ADR 0056)

- **Одна політика для відпустки, лікарняного й тимчасового інтервалу.** `DayOff` (запланована відпустка) і `BarberUnavailability` (довільний інтервал) обидва стають `UnavailableDay`; окремого статусу `onLeave` чи другого шляху скасування немає.
- **Маркування нейтральне.** Збереження інтервалу одразу блокує нові записи й слоти цього барбера в інтервалі, але не змінює статус, час, барбера, ціну чи депозит наявних візитів. Маркування не відхиляється через наявні візити.
- **Один конфлікт на візит.** Кожен майбутній активний візит (для партії — один конфлікт на партію) відкриває `ShiftConflict`. Завершені, скасовані та no-show візити не відкриваються повторно.
- **Рішення — за засновником і по одному візиту.** Перенос на кваліфікованого барбера з валідним слотом або скасування з причиною «barber unavailable»; кожен візит — окрема транзакція. Повторне рішення для закритого конфлікту — no-op. Для партії рішення одне на всю партію: per-leg reassignment відхиляється, а скасування прибирає обидві ноги.
- **Барбер лише позначає.** Він бачить конфлікти, але не переносить і не скасовує чужі візити.
- **Одне повідомлення на рішення.** Текст без медичних подробиць; збій доставки не відкриває конфлікт повторно. Депозит/повернення — за чинним правилом, без спеціального «барбер захворів».

## Розподілене блокування слотів (T-4802)

- **Лок на слот**: `lock:slot:{location}:{barber|any}:{startIso}`. Redis-адаптер `RedisSlotLock` реалізує Redlock (кворум N/2+1, `SET … PX NX`, звільнення Lua compare-and-delete); без `REDIS_URL`/`REDIS_LOCK_URLS` працює `InMemorySlotLock` (dev/test), інваріант у проді все одно тримає serializable-транзакція `Booking` (T-040c).
- **Checkout-резервація**: `POST /booking/slot-reservations` бере слот на `SLOT_RESERVATION_TTL_MS` (60 с за замовчуванням) і повертає `token`; `POST /booking/bookings` приймає `reservationToken` (перевіряється володіння), без токена контролер бере ефемерний лок на час транзакції. `DELETE /booking/slot-reservations` звільняє слот при відмові.
- **Конкурентність**: ретраї з експоненційним backoff (`SLOT_LOCK_BACKOFF_BASE_MS` 25 мс, `SLOT_LOCK_MAX_ATTEMPTS` 3); після вичерпання — `SlotLockedError` → HTTP 409 без побічних ефектів. Стрес-тест `slot-reservations.service.spec.ts`: 50 одночасних резервацій одного слота → 1 переможець, 49 відмов.
- **Аудит**: `SlotLockAuditLogger` пише структуровані події `slot_lock_timeout` / `slot_lock_release_failed` (`Logger` error/warn) — таймаути й збої звільнення не губляться в тиші.

## Self-service графік і погодження зміни часу (T-230 / T-4458)

- **Barber API**: `GET/PUT /barber/schedule/:locationId`, `GET …/history`,
  `POST …/unavailability`. Барбер береться з mobile-сесії (`ClientSessionGuard`),
  а не з тіла; право редагування — `User.selfSchedule`. Вікна перевіряються в
  межах `OpeningHours`; збереження з майбутнім візитом поза вікнами повертає
  `409` зі списком конфліктів і не змінює графік.
- **Журнал**: `ScheduleChangeLog` зберігає `previous → next`, джерело
  (`barber`/`admin`) і автора. Адмінка читає `GET /admin/schedule/change-log`.
- **Заявка на зміну часу**: `POST /schedule/change-requests` → оператор
  `POST /admin/schedule/change-requests/:id/approve|reject` (альтернатива в
  відхиленні) → клієнт `POST /schedule/change-requests/:id/confirm`.
  `ScheduleChangeRequest.agreementEventId` унікальний, тому повторна згода не
  дає другої події; успішна згода виконує `RescheduleAppointment` у тій самій
  транзакції, а конфлікт графіка/вікна запису відкочує її.

## Публічна проекція доступності (OHS, фаза 23)

- `GET /public/availability?location=&service=&barber=` — **read-only read-model** для гостя (сторінки сайту, LST-*): 7 днів, кількості вільних вікон і найближчі часи. Тільки агрегати, без персональних даних; кеш 60 с.
- **Проекція ніколи не бронює** (LST-001): клік веде у флоу запису, де слот перевіряється заново тими самими правилами. Джерело правди — `Availability` + слоти, не проекція.

## Порти (план)

- `AppointmentRepository`
- `BarberScheduleRepository`
- `Clock`

## Хто викликає

Mobile (клієнт і барбер), admin (огляд мережі), web (запис).

**Графік барбера — два письменники за політикою** (фаза 22, SCH-*): `admin` (MNG-ADM-07…09, старший) і барбер self-service з mobile — за прапорцем дозволу на барбері (`identity`); збереження з конфліктами заброньованих візитів для барбера блокується (рішення конфліктів — тільки адмін, SCH-004). Агрегат один — `Availability`.

## Шарність

- `domain/` — Чиста модель. Без Nest, Prisma, HTTP, Expo. Тут entities, value objects, events, repository-порти.
- `application/` — Use cases: command/query, handlers, політики доступу. Транзакція = один use case.
- `infrastructure/` — Адаптери цього контексту (Prisma, HTTP, черга). Зовнішні системи лише через ACL, не в domain.

Код домену не імпортує Nest, Prisma, React Native і HTTP-клієнти. Залежності спрямовані всередину: infrastructure → application → domain.

Публічний API контексту (коли з’явиться код) реекспортує domain + application, **не** infrastructure.
