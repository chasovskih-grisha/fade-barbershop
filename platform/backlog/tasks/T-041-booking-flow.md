# T-041 · Online Booking Flow Implementation

- **Stage**: M2 (phase 4) · **Tags**: backend, booking · **Complexity**: senior · **Depends on**: T-030, T-024, T-022
- **StoryPoints**: 8

## What

End-to-end online booking flow for clients: service selection, location selection, barber selection, date and time slot selection, contact details / OTP verification, and booking confirmation.

## Why

Online booking is the primary acquisition and scheduling channel for clients, reducing front-desk workload.

## Sources

- `docs/booking-flow.md`
- `docs/client-screens.md`

## Done

- [x] Multi-step booking flow implemented on web
- [x] Backend integration for slot validation and appointment creation
- [x] E2E tests passing

## Implementation plan

Paths:
- apps/api/src/scheduling/domain/barber-service-guard.ts
- apps/api/src/scheduling/domain/barber-service-guard.spec.ts
- apps/api/src/scheduling/infrastructure/client-bookings.controller.ts
- apps/api/src/scheduling/infrastructure/client-bookings.deps.ts
- apps/api/src/scheduling/infrastructure/client-bookings.providers.ts
- apps/api/src/scheduling/infrastructure/client-bookings-service-matrix.spec.ts
- apps/api/jest.setup.js

Checks:
- pnpm --filter @fade/api exec jest --runTestsByPath $PWD/apps/api/src/scheduling/domain/barber-service-guard.spec.ts $PWD/apps/api/src/scheduling/infrastructure/client-bookings-service-matrix.spec.ts --forceExit
- pnpm --filter @fade/api exec jest --runTestsByPath $PWD/apps/api/src/booking/e2e/client-booking-confirm.e2e.spec.ts --maxWorkers=1 --forceExit

## Risks

- [ ] **Slot concurrency**: race conditions when multiple clients try to book the same time slot simultaneously.

## Progress

- **Екрани 0–5 наскрізь** (`docs/booking-flow.md`, `docs/client-screens.md`): кроки `apps/web/src/app/booking/steps/*` (локація → послуга →
  барбер → слот → контакти/OTP → підтвердження) з тестами `apps/web/src/app/booking/__tests__/*`; серверний бік —
  `POST /booking/bookings` (`client-bookings.controller.ts`) поверх `BookAppointment`, який тримає перевірку слота, снапшот ціни
  локації, агрегат `Appointment` і подію `booked` в одній транзакції (`persistBookingWithCapacity`, T-040c/T-042a/T-043).

## Re-verified at HEAD (2026-11-26)

- **Крок 2 (барбер) на сервері**: UI ховає барберів поза матрицею «барбер × послуга», але прямий `POST /booking/bookings` з чужим
  `barberId` створював візит. Додано `barberPerformsService()` (`barber-service-guard.ts`) і виклик у `create()` до резервації слота:
  422 `Barber does not perform this service`; порт `barberServices`
  (`client-bookings.deps.ts` / `client-bookings.providers.ts`) віддає `PrismaBarberServiceAssignmentRepository`. Порожня матриця
  (послугу виконують усі) лишається дефолтом — «any barber» і локації без налаштованої матриці не блокуються.
- **E2E**: `booking-flow-gwt.e2e.spec.ts` (7 сценаріїв екранів 0–3) і `client-booking-confirm.e2e.spec.ts` (3 сценарії екрана 5)
  зелені на Postgres цього HEAD. Другий сюїт доти падав (`retry: expected 201, got 409`) не через флоу: контролер підписує
  resume-токен депозиту, а `DEPOSIT_RESUME_SECRET` не було ні в `.env`, ні в `.env.example` — перша відповідь була 500 після
  коміту `Booking`, і retry `postWithRetry` добивав слот. Тепер `jest.setup.js` дає детермінований тестовий секрет, а змінна
  задокументована в `.env.example`.

## Implementation notes

- apps/api/src/scheduling/domain/barber-service-guard.spec.ts
- apps/api/src/scheduling/domain/barber-service-guard.ts
- apps/api/src/scheduling/infrastructure/client-bookings-service-matrix.spec.ts
- apps/api/src/scheduling/infrastructure/client-bookings.controller.ts
- apps/api/src/scheduling/infrastructure/client-bookings.deps.ts
- apps/api/src/scheduling/infrastructure/client-bookings.providers.ts

## QA

- `pnpm --filter @fade/api exec jest --runTestsByPath $PWD/apps/api/src/scheduling/domain/barber-service-guard.spec.ts $PWD/apps/api/src/scheduling/infrastructure/client-bookings-service-matrix.spec.ts --forceExit` exit 0
- `pnpm --filter @fade/api exec jest --runTestsByPath $PWD/apps/api/src/booking/e2e/client-booking-confirm.e2e.spec.ts --maxWorkers=1 --forceExit` exit 0
