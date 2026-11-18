# T-010 · OTP Login: RequestOtp / VerifyOtp

- **Stage**: M1 (phase 1) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-001, T-002
- **StoryPoints**: 5

## What

Implement `identity`: `RequestOtp` (number → SMS; dev — console sender `OtpSender`) and `VerifyOtp` (number + code → Session; first successful OTP of a new number creates a `User` with role `client` — implicit registration, no separate UI). E.164 normalization `+380…`, Code TTL 5 min, resend limits (60 s), brute-force blocking. Events: `OtpRequested`, `UserRegistered`, `SessionStarted`.

## Why

Unified network identity: single `User` on site, app, and shop; passwordless. v1 checklist gate (phase 1).

## Sources

- ADR 0005 (full semantics: normalization, TTL, limits, sessions across surfaces)
- `identity` README (use cases, ports, events)
- Scenario: `booking-flow-tests.md` (flow precondition); `web-cabinet-screens.md` §1

## Done

- [x] OTP flow works on web and mobile (dev: code in logs) — backend context ready for both channels (`channel: web|mobile|admin`), verified end-to-end via HTTP on channel `web`; UI consumption of cabinet — T-032, mobile — phase 6
- [x] Limits, TTL, brute-force blocking — per ADR 0005
- [x] Events are recorded in outbox

## Risks

- [x] **SMS provider**: provider integration via separate task; currently dev sender (code in logs). Anti-spam in place: resend ≤60 s prohibited (`OTP_RESEND_TOO_SOON`, 429 + `Retry-After`)
- [x] **Brute-force**: after 5 failed attempts — blocking for 10 min (`OTP_LOCKED`, 429 + `Retry-After`); failed attempts are stored in DB atomically with verification

## Status

- **2026-09-21 — Implemented end-to-end (finalization)**: `identity` context per ADR 0005. Domain (pure, without Prisma/Nest dependencies): `PhoneNumber` (E.164 `+380…`), `OtpCode` (`salt:sha256(salt+code)`), `OtpChallenge` (TTL 5 min, 5 attempts → 10 min lock), `User` (implicit registration, role `client`), `Session` (`web|mobile|admin`, token hashed). Application: `RequestOtpHandler` (resend gate 60 s), `VerifyOtpHandler` (failures saved in the same transaction, error thrown after commit). Infrastructure: Prisma adapters (User, OtpChallenge, Session), `PrismaUnitOfWork` (AsyncLocalStorage + interactive transaction), `PrismaOutboxPublisher` (transactional outbox), dev `OtpSender`. HTTP: `POST /identity/otp/request` (201/429) and `/identity/otp/verify` (200 with `{token, user}`), `Retry-After` via `IdentityExceptionFilter` (Nest 10 without headers in options). Contracts in `packages/contracts/identity.ts` (consumers depend on contracts, not domain API). Smoke test on real Postgres: request code → 201; resend within 60 s → 429; incorrect code → 400 + attempts increment; correct → token + user `client` (implicit registration); reuse code → 400; in DB: 1 User, 1 Session, outbox 3 events (`identity.otp.requested`, `identity.user.registered`, `identity.session.started`). Found and fixed two issues during smoke test: duplicate manifest in `identity.exception-filter.ts` (broken compiled output) and DI factories accepting array instead of Nest positional arguments (`uow` was `undefined` → now `...deps: RequestOtpDeps`/`VerifyOtpDeps`). `apps/api` migrated to `tsconfig.build.json` + dependency `@fade/contracts: workspace:*` (tsc --build conflicted with nest build). Added logging of unknown errors in controller and exception filter. All gates green: format, format:check, lint (including hex, max-lines ≤100, max-params ≤3), typecheck, build (web+admin+api), test (api 29 + ui 119, api coverage 100% per file), design-tokens verify (contrast AA), compose config, `prisma migrate status` up to date. Next: T-011 (cookie sessions, `web.cabinet` flow), T-012 (roles/founder seed); on phases 3/6 — cabinet UI (T-032) and mobile OTP consumption.
