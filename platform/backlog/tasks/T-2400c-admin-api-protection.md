# T-2400c · Захист API ендпоінтів (5/15)

- **Stage**: M5 (phase 30) · **Tags**: backend, security · **Complexity**: middle · **Depends on**: T-020, T-012
- **StoryPoints**: 5

## What
Add захист до адмінських API: authorization через JWT, ролева перевірка, rate limiting. Тестування всіх ендпоінтів з різними ролями.

## Why
Безпека адмінських даних. Запобігання несанкціонованого доступу. Захист від атак.

## Sources
- ADR 0027 (рольова модель адмінки; статус **proposed** — рішення на старті задачі; джерело правди v1: identity README + AC 04)
- docs/auth.md — фантом 2026-09-22: файл ніколи не існував; джерело приймається на старті задачі

## Done
- [ ] Middleware додано
- [ ] Валідатор налаштований
- [ ] Тестування пройшло

## Implementation plan

Checks:
- `apps/api/src/identity/infrastructure/admin-client-otp.controller.spec.ts`
- `apps/api/src/shared/rate-limit/rate-limit.module.spec.ts`
- `pnpm --filter @fade/api exec jest src/identity/infrastructure/admin-client-otp.controller.spec.ts src/shared/rate-limit/rate-limit.module.spec.ts`

## Progress

- 2026-11-17: rate limit on `POST /admin/clients/otp/request` — SMS-spam surface had no limiter, unlike client OTP request and admin login (T-4410). New `ADMIN_CLIENT_OTP_LIMITER` (5/год у прод, dev-дефолт 1000) wired into `AdminClientOtpController.request`. Role check on admin endpoints is already covered by the global `AdminSessionGuard` (APP_GUARD). Remaining: review role-specific access per section (depends on ADR 0027 acceptance).