# T-4521c · Web «батько + син» у флоу запису

- **Stage**: M1 (phase 4) · **Tags**: frontend · **Complexity**: middle · **Depends on**: T-4521a, T-4521b
- **StoryPoints**: 3

## What

Виділено з T-4521b, бо T-4521b закриває адмін-матрицю й фільтр кроку 2, а весь web-флоу партії
(екран 1б «режим» + паралельний мультивибір на кроці 2 + вимкнення пари на нульовому перетині
послуг) — окрема робота зі своїм екраном.

## Sources

- `docs/booking-flow.md` §Екран 1б, §Екран 2 (parallel), §father-son
- `docs/booking-flow-tests.md` (гілки слота)
- `apps/web/src/app/booking/steps/*`

## Done

- [x] Екран 1б показується лише для `father-son`; картка parallel disabled з причиною, коли в зміні менше двох барберів
- [x] Крок 2 для parallel: «Будь-які два вільні» + мультивибір рівно двох різних барберів, пара з нульовим перетином послуг disabled із посиланням на матрицю
- [x] Кейс у `docs/booking-flow-tests.md` для цієї гілки

Пакет розпізнається за `parallelDuration` у `ServiceDto`; пара впливає на сітку двома шляхами:
`fulfillmentMode: 'parallel'` у `POST /booking/slots` (енджин уже рахує сітку за
`service.parallelDuration`) і клієнтський перетин `slot.barbers` — лишаються старти, де обидві ноги
партії вільні. Клієнтський `POST /booking/bookings` приймає одного `barberId`, тому створення
appointment-party лишається адмінським (`admin/appointment-parties`), а вибір пари — UI-обмеженням.
Кейс для гілки вже існує в `docs/booking-flow-tests.md:45-61` (екран 1б) і `:83` (parallel-гілка),
тож окремого допису в docs ця робота не потребує.

## Implementation plan

Paths:
- apps/web/src/app/booking/party-flow.ts
- apps/web/src/app/booking/partyActions.ts
- apps/web/src/app/booking/steps/PartyModeStep.tsx
- apps/web/src/app/booking/steps/BarberPairStep.tsx
- apps/web/src/app/booking/steps/step2.tsx
- apps/web/src/app/booking/__tests__/party-flow.test.tsx

Checks:
- pnpm --filter @fade/web exec jest apps/web/src/app/booking/__tests__/party-flow.test.tsx

## Risks

- [ ] **Порожній екран 1б**: без пари барберів зі спільною послугою режим parallel має лишатись вимкненим, а не давати порожній крок 3.

## Implementation notes

- apps/web/src/app/booking/__tests__/party-flow.test.tsx
- apps/web/src/app/booking/party-flow.ts
- apps/web/src/app/booking/partyActions.ts
- apps/web/src/app/booking/steps/BarberPairStep.tsx
- apps/web/src/app/booking/steps/PartyModeStep.tsx
- apps/web/src/app/booking/steps/step2.tsx
- apps/web/src/app/booking/useBookingData.ts
- apps/web/src/app/booking/useBookingFlow.ts

## QA

- `pnpm --filter @fade/web exec jest apps/web/src/app/booking/__tests__/party-flow.test.tsx` exit 0
