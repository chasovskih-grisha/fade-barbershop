# T-4534 · Appointment status history & audit trail

- **Stage**: M1 (phase 4) · **Tags**: backend, scheduling, audit · **Complexity**: middle · **Depends on**: T-042, T-042b
- **StoryPoints**: 5

## What

Розширення життєвого циклу Appointment (T-042) повною історією змін статусів та полів:
- Автоматичне логування кожної зміни статусу (pending → confirmed → arrived → in_progress → completed/no_show/cancelled)
- Зберігання актора (admin/barber/client/system), timestamp, попереднє/нове значення
- Історія зміни барбера, послуг, тривалості, ціни, нотаток
- API для отримання історії запису (admin/barber/client залежно від прав)
- UI в адмінці та кабінеті барбера: вкладка "Історія" на картці запису

## Why

Повний аудит-трейл для розслідування конфліктів, аналітики no-show, compliance. Вимагається для T-4216 (фінансовий аудит) і T-4496 (нічні перевірки).

## Sources

- T-042 (appointment lifecycle), T-4216 (financial audit trail), T-4496 (nightly integrity checks)
- Altegio: historia zmian statusu, historia edycji wizyty

## Done

- [ ] Доменна подія `AppointmentStatusChanged` з полями actor, oldStatus, newStatus, reason
- [ ] Проекція `AppointmentHistory` (read model) в scheduling або окремий контекст
- [ ] API `GET /appointments/{id}/history` з пагінацією
- [ ] UI: вкладка історії в адмінці (T-4528) та barber mobile (T-083)
- [ ] migration існуючих записів (backfill з outbox подій)

## Audit 2026-11-24

Reopened. Only the pure domain projection exists:
`appointment-status-history.ts` with `buildStatusHistory`/`orderHistory`/
`paginateHistory` and its unit spec. Nothing calls it. There is no persisted
`AppointmentHistory` read model, no event handler, no API, no admin/barber UI, and
no backfill. The task-level QA command passes against the domain spec while all
five Done criteria remain unmet.

## Reopening slices (2026-11-25)

Порядок: S1 → S2 → S3. Барбер-мобайл частина S3 заблокована T-083 (застосунку барбера
ще немає); API й адмінка від неї не залежать. Проєкція `appointment-status-history.ts`
уже готова — слайси лише підключають її до персистентності, API та UI.

### S1 · Персистентний read model + проєктор подій

Файли:
- `apps/api/prisma/schema.prisma` — `model AppointmentHistory` (`id`, `appointmentId`,
  `fromStatus`, `toStatus`, `actorId`, `actorRole`, `reason`, `occurredAt`, `sourceEventId @unique`,
  `@@index([appointmentId, occurredAt])`), міграція
- `apps/api/src/scheduling/infrastructure/prisma-appointment-history.repository.ts` (new) —
  `appendOnce(entries)`, `list(appointmentId, page)`
- `apps/api/src/scheduling/infrastructure/appointment-history.projection.ts` (new) — за зразком
  `appointment-activity.projection.ts` (`handleOne(message, tx)`, той самий outbox-релей і
  транзакція): `buildStatusHistory`/`orderHistory` → `sourceEventId` claim → рядки історії
- провайдер у `scheduling.module.ts` поряд з `AppointmentActivityProjection`

Тестовані Done:
- Повторна доставка тієї самої події не створює другого рядка (unique `sourceEventId`).
- Ланцюг `booked → confirmed → in_progress → completed` дає 4 рядки з правильними `from/to`;
  подія `rescheduled` у таблицю не пише (статус не змінюється).
- `Appointment.confirm({actorId, actorRole})` → рівно один рядок з цим актором і причиною `null`.
- `cancel(reason)` зберігає `reason`; видалений/невідомий тип події ігнорується без помилки.

Перевірка: `pnpm --filter @fade/api exec jest src/scheduling/infrastructure/appointment-history.projection.spec.ts src/scheduling/domain/appointment-status-history.spec.ts`

### S2 · `GET /appointments/:id/history` з доступами й пагінацією

Файли:
- `apps/api/src/scheduling/infrastructure/client-appointments.controller.ts`,
  `barber-appointments.controller.ts`, `admin-appointments.controller.ts` — новий GET, спільний
  серіалізатор із `paginateHistory`
- guard доступу: клієнт — лише власний `clientId`, барбер — лише свої записи, адмін — усі

Тестовані Done:
- Відповідь `{ items, total }`, `items` від найновіших; `limit` обмежений (напр. 100),
  `offset` за межами дає порожній `items` із правильним `total`.
- Чужий запис для клієнта → **404** (не 403, щоб не палити існування), барбер без цього візиту → 404.
- Адмін бачить той самий запис; серіалізатор віддає `fromStatus`/`toStatus`/`actorRole`/`reason`/
  `occurredAt` в ISO.
- Пагінація стабільна при однакових `occurredAt` (сортування за `occurredAt desc, id desc`).

Перевірка: `pnpm --filter @fade/api exec jest src/scheduling/infrastructure/client-appointments.controller.spec.ts src/scheduling/infrastructure/admin-appointments.controller.spec.ts`

### S3 · UI (адмінка, клієнт, барбер) + backfill

Файли:
- `apps/admin/src/app/bookings/[uuid]/BookingHistoryCard.tsx` — рядки переходів (було → стало,
  роль актора, причина, локалізований час) з нового API; сирий журнал outbox лишається нижче
- `apps/admin/src/app/bookings/[uuid]/booking-journal-rows.tsx` (поряд) — компонент рядка історії
- `apps/mobile/src/app/(client)/appointment/[id]/appointment-detail-body.tsx` — секція «Історія»
  для клієнта (лише власні зміни); барбер-версія — після T-083
- `apps/api/scripts/backfill-appointment-history.ts` (new) — `--dry-run` / бойовий прогін з outbox

Тестовані Done:
- `--dry-run` друкує кількість рядків за статусами; бойовий прогін вставляє рівно цю кількість,
  повторний прогін — `0 inserted` (ідемпотентність).
- Backfill не чіпає записи без статусних подій і не падає на подіях невідомого типу.
- Компонентний тест адмінки: `BookingHistoryCard` показує «Заплановано → Підтверджено» і причину
  скасування; порожня історія дає наявний `EmptyState`.
- `pnpm docs:validate` — без нових помилок.

Перевірка: `pnpm --filter @fade/admin test -- BookingHistoryCard && pnpm --filter @fade/api exec jest src/scheduling/application/appointment-history`

## Risks

- [ ] **Обсяг даних**: історія росте швидко — партиціонування по appointment_id + архівування
- [ ] **Права доступу**: клієнт бачить лише свою історію, барбер — свої записи, адмін — все

## Implementation plan

Paths:
- apps/api/src/scheduling

Checks:
- pnpm --filter api test appointment-status-history.spec.ts

## Implementation notes

- apps/api/src/scheduling/domain/appointment-status-history.spec.ts

## QA

- `pnpm --filter api test appointment-status-history.spec.ts` exit 0
