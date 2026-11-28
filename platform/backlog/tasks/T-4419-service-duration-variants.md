# T-4419 · Гнучка тривалість послуг (short/long)

- **Stage**: M1 (phase 4) · **Tags**: backend, catalog · **Complexity**: middle · **Depends on**: T-040, T-024
- **StoryPoints**: 5

## What

`DurationVariant` у послуги: варіанти тривалості (коротший/стандартний/довший) з окремою ціною і описом; вибір варіанта у флоу запису (крок 2), слот розраховується від тривалості варіанта, снепшот ціни зберігається з вибраним варіантом (T-044 ціновий аудит не ламається).

## Why

«Стрижка» 30-45 хв і «Стрижка + борода» — різні слоти; зараз тривалість послуги одна, а база вимагає список. Без варіантів адмін заводить декілька послуг «Стрижка 30/45/60», завивається каталог.

## Sources

- scheduling README; catalog README; booking-flow.md; T-044 (снепшот ціни)

## Done

- [x] Варіант тривалості в моделі; валідація не перекладає п'ятислот
- [x] Флоу запису пропонує варіант; снепшот зберігає обраний
- [x] Зворотна сумісність: послуга без варіантів = стандарт (Т-041 не регрес)

## Audit 2026-11-24

Reopened. Only `catalog/domain/duration-variant.ts` and its unit spec exist;
`selectDurationVariant` is used only by the test. There is no schema column or
catalog persistence, no service payload/API field, and no booking-flow selection
or snapshot of the chosen variant. The three Done criteria are unmet.

## Reopening slices (2026-11-25)

Порядок: S1 → S2 → S3. Чекбокси Done закриваються після всіх трьох; кожен слайс
самостійно шипиться і перевіряється.

### S1 · Варіанти в каталозі й адмін-API

Файли:
- `apps/api/prisma/schema.prisma` — `durationVariants Json?` у `model Service` (поряд із `faq`),
  міграція `apps/api/prisma/migrations/<ts>_add_service_duration_variants/`
- `apps/api/src/catalog/domain/service.ts` — `ServiceProps.variants?: DurationVariant[]`,
  `update({ variants })`, геттер
- `apps/api/src/catalog/application/create-service.ts`, `update-service.ts` — валідація через
  `assertDurationVariant` з `domain/duration-variant.ts`
- `apps/api/src/catalog/infrastructure/service-row.ts`, `admin-services.dto.ts`,
  `admin-services.controller.ts` — мапінг і поля `variants`

Тестовані Done:
- `POST /admin/services` з трьома варіантами повертає їх у відповіді й після повторного читання.
- Невалідний варіант (порожній label, duration 3, дробовий `priceDelta`) → **400** і жодного рядка
  в БД.
- Послуга без `variants` повертає `variants: null` і зберігає поточні `duration`/`parallelDuration`;
  наявні тести `service.spec.ts` і T-041-регресія зелені без правок.
- Повторна валідація при читанні не падає на старих рядках (null → без варіантів).

Перевірка: `pnpm --filter @fade/api exec jest src/catalog/application src/catalog/domain/duration-variant.spec.ts`

### S2 · Слоти, публічний payload і снепшот вибору

Файли:
- `apps/api/src/booking/infrastructure/available-slots.request.ts` — `resolveDuration` бере
  `resolveDurations(service, variantLabel)` замість `service.duration`
- `apps/api/src/booking/dto/slot-request.dto.ts`, `slot-request.zod.ts` — необов'язковий `variantLabel`
- `apps/api/src/catalog/infrastructure/public-services.reader.ts` і `service-row.ts` — віддавати
  `variants` разом із ціною локації (`ServicePrice.amount + priceDelta`)
- `apps/api/prisma/schema.prisma` + міграція — `durationVariant String?` на `Booking`
- `apps/api/src/scheduling/infrastructure/client-bookings.controller.ts` і
  `scheduling/application/book-appointment.use-case.ts` — приймати `variantLabel`, валідувати його,
  писати `agreedDuration` з варіанта, `agreedPrice` = базова ціна + `priceDelta`, снепшот
  `durationVariant`

Тестовані Done:
- Для послуги з варіантами 30/60 хв останній доступний старт для 60 хв раніший рівно на 30 хв, ніж
  для 30 хв (spec на `AvailableSlots`).
- Невідомий `variantLabel` → **400** з `InvalidDurationVariantError`, слоти не генеруються.
- Створений запис містить `durationVariant`, `agreedDuration` варіанта й ціну з поправкою; зміна
  каталогу після цього не рухає снепшот.
- Запис без `variantLabel` дає ті самі слоти/ціну/тривалість, що й до слайса (регресійний тест).

Перевірка: `pnpm --filter @fade/api exec jest src/booking/infrastructure/available-slots src/scheduling/application/book-appointment.pricing.spec.ts`

### S3 · Контракт, клієнтські DTO і документація

Файли:
- `packages/contracts/src/` — тип `ServiceDurationVariant` і поле `variants` у сервісному DTO,
  експорт з `index.ts`
- `apps/web/src/app/booking/**` і `apps/mobile/src/lib/api/booking.ts` — використати цей тип,
  передавати `variantLabel`
- `docs/booking-flow.md` §Екран 2 — вибір варіанта (коротший/стандартний/довший) і що ціна
  снепшотиться з вибором

Тестовані Done:
- Контрактний тип експортований і імпортується web+mobile без локальних дублікатів
  (`packages/contracts/src/__tests__`).
- `pnpm docs:validate` — без нових помилок відносно baseline.
- Наскрізний тест: вибір варіанта у флоу → слот іншої довжини → снепшот ціни/тривалості на записі.

Перевірка: `pnpm --filter @fade/contracts test && pnpm docs:validate`

## Risks

- [x] **Дві ціни**: варіант vs знижки (T-030) — порядок застосування в ДТ тестом каталогу
## Implementation plan

S2 (booking flow) and S3 (contract and docs) for the same row.

Paths:
- apps/api/prisma/schema.prisma
- apps/api/prisma/migrations/20261127010000_add_booking_duration_variant/migration.sql
- apps/api/src/scheduling/application/service-preparation.ts
- apps/api/src/scheduling/domain/booking.data.ts
- apps/api/src/scheduling/domain/booking.ts
- apps/api/src/scheduling/infrastructure/prisma-booking.repository.ts
- apps/api/src/scheduling/infrastructure/prisma-booking.repository.persist.ts
- apps/api/src/scheduling/dto/book-slot.dto.ts
- apps/api/src/scheduling/dto/client-booking.dto.ts
- apps/api/src/scheduling/application/admin-booking-detail.rows.ts
- apps/api/src/scheduling/application/admin-booking-detail.map.ts
- apps/api/src/scheduling/application/admin-booking-detail.view.ts
- apps/api/src/scheduling/application/admin-booking-detail.spec.ts
- apps/api/src/booking/infrastructure/available-slots.request.ts
- apps/api/src/booking/infrastructure/available-slots.ts
- apps/api/src/booking/dto/slot-request.dto.ts
- apps/api/src/booking/dto/slot-request.zod.ts
- apps/api/src/catalog/infrastructure/service-price-queries.ts
- packages/contracts/src/scheduling.ts
- packages/contracts/src/__tests__/scheduling.spec.ts
- apps/api/src/scheduling/application/service-preparation.spec.ts
- apps/api/src/booking/infrastructure/available-slots.request.spec.ts
- apps/api/src/scheduling/domain/booking-duration-variant.spec.ts
- docs/booking-flow.md

Checks:
- npx jest --config apps/api/jest.config.js --runTestsByPath apps/api/src/scheduling/application/service-preparation.spec.ts apps/api/src/booking/infrastructure/available-slots.request.spec.ts apps/api/src/scheduling/domain/booking-duration-variant.spec.ts apps/api/src/catalog/application/services-variants.spec.ts apps/api/src/scheduling/application/admin-booking-detail.spec.ts

## Implementation notes

- apps/api/src/scheduling/application/admin-booking-detail.map.ts
- apps/api/src/scheduling/application/admin-booking-detail.spec.ts

## QA

- `npx jest --config apps/api/jest.config.js --runTestsByPath apps/api/src/scheduling/application/service-preparation.spec.ts apps/api/src/booking/infrastructure/available-slots.request.spec.ts apps/api/src/scheduling/domain/booking-duration-variant.spec.ts apps/api/src/catalog/application/services-variants.spec.ts apps/api/src/scheduling/application/admin-booking-detail.spec.ts` exit 0
