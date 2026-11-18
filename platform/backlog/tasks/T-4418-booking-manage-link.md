# T-4418 · Booking Management Link (Without Authorization)

- **Stage**: M1 (phase 4) · **Tags**: backend, notifications, security · **Complexity**: middle · **Depends on**: T-041, T-080, T-4400
- **StoryPoints**: 5

## What

Link in SMS confirmation/reminder (T-080, domain `fade.com.ua`): secret token-key to specific booking → page "Confirm/Reschedule/Cancel" **without login**. Token: single-use/blind until viewing real booking, signed by application, expiration = booking lifetime, rate limit on `GET` (T-4410). This does not replace cabinet — only quick user action from SMS flow.

## Why

CLT-01: client calls/confirms by phone call; confirmation via SMS link eliminates manager calls (T-042 lifecycle assumes our own state changes).

## Sources

- booking-flow.md (statuses, step 2); T-042 (state change by confirmation); notifications README

## Done

- [ ] Single-use signed token in SMS; action page works without login
- [ ] After action, token is invalid; rate limit and audit on view
- [ ] Confirm/cancel flow via token passes in e2e (T-043 flow tests)

## Risks

- [ ] **Token abuse**: brute-force → limits on `GET /manage/{token}` + very fuzzy "valid only for owner" text

## Implementation plan

Paths:
- apps/api/src/booking/infrastructure/booking.controller.ts

Checks:
- pnpm --filter api test:unit

## Implementation notes

- apps/api/src/booking/infrastructure/booking.controller.ts
