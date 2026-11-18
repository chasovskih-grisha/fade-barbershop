# ADR 0005. Client login by phone number (OTP)

- Status: accepted
- Date: 2026-09-07

## Context

Client must login from both site and iOS/Android. Password for one-time barbershop visits — friction. Email not common guest identifier. Phone already needed for reminders and booking.

## Decision

For role `client` only login method in v1 — **phone number + SMS OTP**.

1. Client enters phone (E.164 normalization, Ukraine `+380`).
2. API creates `OtpChallenge`, sends code via port `OtpSender`.
3. Correct code opens `Session`. If `User` with this number doesn't exist — creates `User` with role `client` (registration = first successful OTP).
4. Same `UserId` on site and in app. Not two accounts "web" and "mobile".

Sessions:

| Surface | How we hold session |
|---------|---------------------|
| `apps/web` | httpOnly cookie, separate cookie-name from admin |
| `apps/mobile` | access + refresh bearer |
| `apps/admin` | separate domain and session; client OTP doesn't let in |

Client has no password. Apple / Google — later, as binding to existing phone, not OTP replacement.

Barber and admin don't login to guest cabinet on public site. Barber — only mobile. Admin — only `apps/admin`.

## Consequences

- SMS provider (TurboSMS / AlphaSMS / analog) via `OtpSender`. In dev — `console` (code in log).
- Limits: resend, code attempts, TTL (e.g. 5 min), brute-force blocking.
- Number — unique key `User`. Number change — separate use case, not "another login".
- Personal data: phone = login; consent and policy — `business/legal-ua/personal-data.md`.
