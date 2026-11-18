# T-4536 · Appointment source tracking (creation channel attribution)

- **Stage**: M1 (phase 4) · **Tags**: backend, analytics, scheduling · **Complexity**: junior · **Depends on**: T-041, T-042, T-053, T-046
- **StoryPoints**: 3

## What

Поле `source` на `Appointment` з enum:
- `ADMIN_PHONE` — адмін створив по телефону (T-046)
- `ADMIN_WALKIN` — walk-in (T-120)
- `BARBER_MOBILE` — барбер створив у mobile (T-082)
- `CLIENT_WEB` — клієнт через web (T-041)
- `CLIENT_MOBILE` — клієнт через mobile (T-071)
- `QUICK_BOOKING` — quick-booking fade.com.ua/booking (T-053)
- `GBP` — Google Business Profile (T-260)
- `EXTERNAL_INTEGRATION` — через API/webhook (T-3802)
- `WAITLIST_AUTO` — автозаповнення з waitlist (T-170)
- `RECURRING` — регулярний запис (future)

Автоматичне заповнення при створенні через відповідний use case. Використовується в аналітиці (T-110, T-3201) та маркетингу.

## Why

Аналітика каналів залучення, ROI маркетингу, операційне планування (скільки дзвінків vs онлайн).

## Sources

- T-041, T-042, T-046, T-053, T-071, T-120, T-170, T-260, T-3802
- Altegio: źródło rezerwacji (telefon, online, aplikacja, GBP, integração)

## Done

- [ ] Add `source` в Prisma модель Appointment, enum в shared kernel
- [ ] Update всі use cases створення запису: book, walkin, quickBooking, waitlistFill, adminPhoneBooking, barberMobileBooking
- [ ] API: фільтр по source в адмін-списку записів
- [ ] Аналітика: розбивка по source в T-110 / T-3201

## Risks

- [ ] **Backfill**: існуючі записи без source — migration з default `UNKNOWN`

## Implementation notes

- apps/api/src/analytics/application/booking-source-breakdown.spec.ts
- apps/api/src/analytics/application/booking-source-breakdown.ts
- apps/api/src/analytics/infrastructure/analytics.module.ts
- apps/api/src/analytics/infrastructure/booking-source.controller.ts
- apps/api/src/analytics/infrastructure/prisma-booking-source.stats.ts
- apps/api/src/scheduling/domain/booking-source.spec.ts
- apps/api/src/scheduling/domain/booking-source.ts

## Scope notes

Аудит перед стартом: `Booking.source` у схемі, запис джерела в use case
(`assertSnapshots`), відображення в адмін-картці/календарі вже були на `stage`
(T-046, ANL-004). Реально бракувало трьох Done-пунктів, їх і закрито:
(1) канонічний набір із 10 каналів у shared kernel `domain/booking-source.ts`
(історичні `web`/`admin`/`mobile` лишаються валідними аліасами, міграція даних
не потрібна), валідація в `booking-source-rules.ts` перейшла на нього;
(2) фільтр `?source=` в адмін-списку (`CalendarQuery.source` → `AdminCalendar`,
аліаси розширюються в `bookingSourceFilter`); (3) аналітика —
`GetBookingSourceBreakdown` + `GET /admin/analytics/booking-sources`, аліаси
зливаються в канонічні канали, невідомі не губляться (`unknown`).
Не закрито цим комітом: мобільні/веб-клієнти, що надсилають нові канали,
живуть у фронтенд-лейні; назви каналів у UI — там само.

## Implementation plan

Paths:
- apps/api/src/scheduling/domain/booking-source.ts
- apps/api/src/scheduling/domain/booking-source.spec.ts
- apps/api/src/analytics/application/booking-source-breakdown.spec.ts

Checks:
- `pnpm --filter @fade/api exec jest apps/api/src/scheduling/domain/booking-source.spec.ts apps/api/src/analytics/application/booking-source-breakdown.spec.ts`

## QA

- `pnpm --filter @fade/api exec jest apps/api/src/scheduling/domain/booking-source.spec.ts apps/api/src/analytics/application/booking-source-breakdown.spec.ts` exit 0
