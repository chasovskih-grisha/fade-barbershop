# T-4410 · Shared Rate Limiting Layer (Shared Kernel)

- **Stage**: M1 (phase 1) · **Tags**: backend, security, infra · **Complexity**: middle · **Depends on**: T-010, T-053, T-4301
- **StoryPoints**: 5

## What

`RateLimiter` in shared kernel (`shared/rate-limit/`): Redis adapters (ZSET sliding window, prod) and in-memory (dev/test — `LocalGeocoderRateLimitStore` pattern), sliding window per key (number/IP/device), `429` JSON response with `retryAfterSec` + violation counter `fade_rate_limit_violations_total` (read by T-4204). Applied to public OTP endpoints: `POST /identity/otp/request` (5/hour per number) and `POST /identity/otp/verify` (10/hour per number), and admin login: `POST /admin/auth/login` (5/hour per username+IP in prod; dev default 10 — password guessing cheaper than SMS spam).

## Why

Unauthenticated public endpoint (T-053) = spam booking, OTP guessing, SMS provider exhaustion — risk already in register; limits in T-053 Done currently "via manual gate", need code scaffold.

## Sources

- security-hardening.md; ADR 0005 (OTP); engineering-principles.md; T-053 risk in index README

## Done (2026-09-27)

- [x] `RateLimiter` (Redis/in-memory) with window boundary tests (sliding: point ages → allowed again)
- [x] OTP endpoints under limits; violation → `429` JSON `{code: 'RATE_LIMITED', retryAfterSec}`
- [x] Violation metric exposed: `fade_rate_limit_violations_total` in /metrics (null if IdentityModule not in graph)
- [x] Live verification: 6×POST → `201 429×5`, counter = 5 in /metrics
- [x] **Admin login under limit (2026-09-28)**: `ADMIN_LOGIN_LIMITER` (env `RATE_LIMIT_ADMIN_LOGIN_MAX/WINDOW_MS`, prod 5/h, dev 10/h); key `admin-login:username:IP` (X-Forwarded-For — first IP behind gateway T-4210); 429 before AdminLoginHandler (guessing doesn't pollute audit log); violations counted by RateLimitMetrics. Tests: controller (key/429/metric/XFF) + policies (defaults and env, regression of OTP defaults)

## Risks

- [ ] **Simplified gateway**: gateway-level rate limit (T-4210) does not replace it — our part is at app level (Redis adapter ready; gateway connection is T-4210)
