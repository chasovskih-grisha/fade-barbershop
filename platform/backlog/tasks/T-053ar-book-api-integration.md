# T-053ar · API integration book.fade.com.ua

- **Stage**: M1 (phase 4) · **Tags**: frontend · **Complexity**: middle · **Depends on**: T-053c, T-041
- **StoryPoints**: 5

## What

API integration for quick-booking:
- OpenAPI contract integration (T-001b)
- GET /services endpoint
- GET /barbers endpoint
- GET /slots endpoint
- POST /bookings endpoint
- POST /auth/otp endpoint
- Error handling and retry logic
- Request/response validation

## Sources

- T-001b (contracts package)
- T-041 (booking flow)
- packages/contracts

## Done

- [x] OpenAPI integrated
- [x] GET /services works
- [x] GET /barbers works
- [x] GET /slots works
- [x] POST /bookings works
- [x] POST /auth/otp works
- [x] Error handling works
- [x] Validation works

## Verification (2026-11-10, status remains `review`)

Verified by code and tests: `pnpm --filter web exec jest src/app/booking` — 6 suites / 15 tests, green. **Not closed**: half of the checklist is not fulfilled.

**Held**
- `GET /booking/services/:locationId`, `GET /booking/barbers/:locationId`, `POST /booking/slots`, `POST /booking/bookings` — calls in `apps/web/src/app/booking/bookingApi.ts`, routes in `apps/api/src/booking/infrastructure/booking.controller.ts`; flow passes them in live spec run (mock fetch checks paths, not contract).
- Error handling: `json()` throws on `!res.ok`, errors settle in step state and `bookingAnalytics.failed()`.

**Not fulfilled**
- **OpenAPI contract not integrated**: booking DTOs are handwritten (`apps/web/src/app/booking/types.ts`); `@fade/contracts` not used in flow at all (only `lib/api/articles.ts` and `lib/api/client-sessions.ts`).
- **`POST /auth/otp` — no such route either in code or flow**: OTP lives under `/identity/*` (`client-sessions.controller.ts`, `admin-client-otp.controller.ts`) and `/login`, while `bookingApi.ts` calls only `/booking/*`; booking is anonymous (no phone, no OTP step).
- **Retry logic missing**: `bookingApi.ts` has no retries or backoff — only manual "Try again" on location step (`LocationStep.tsx`).
- **Request/response validation missing**: responses cast `as T` without parsing (zod not used in flow).

**Why not closed:** three items are not "unfinished business", but discrepancy between plan and actual flow (anonymous booking without OTP) and missing contract layer. Closing requires a decision: either narrow checklist to anonymous flow and fix in T-041, or add contract/retry/validation as a separate step.

## Risks

- [x] **API changes**: contract may change unexpectedly
