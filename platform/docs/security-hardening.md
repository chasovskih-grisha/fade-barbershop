# Security hardening — platform baseline level

> **Status:** real minimum, verified by actual code (2026-09-24). Not phantom.
> **Links:** [engineering-principles.md](engineering-principles.md), ADR 0027 (roles), AC 04 + OWASP ASVS (T-4210 requirements source). This document fixes **what already works** and **what forbidden to break**; extensions (WAF, bot detection, MFA) — T-4210 subject at its start.

## 1. Authentication and sessions (already in code)

- **Admin passwords**: scrypt with salt (`identity/domain/password.ts`), `timingSafeEqual` check. Min length — `PASSWORD_MIN_LENGTH` constant. OTP codes stored **only as hash** (`codeHash`); plaintext code in DB forbidden (migration 20261007000000 removed old format).
- **Sessions**: token → `sha256` → `Session.tokenHash` (unique); cookie `fadoidx`, HttpOnly; logout = revocation (`revokedAt`), not deletion — revoked sessions not accepted.
- **Global guard**: `AdminSessionGuard` as `APP_GUARD` — each `/admin/*` path requires admin-channel session, except explicit `PUBLIC_ADMIN_AUTH` list (`login/me/logout`). New admin controller protected by default; **remove protection only by explicit entry in this list**.
- **Data visibility**: disabled location/service disappears from public responses immediately (MNG-ADM-02); public endpoints don't return service fields (created/updated, draft flags).

## 2. Secrets and configuration

- Secrets — via env (`GOOGLE_MAPS_API_KEY`, `DATABASE_URL`), not in code and not in migrations; missing key = function degradation (adapter returns null), not process crash.
- Logs and exceptions don't get: client coordinates (geolocation lives in request memory), OTP codes, session tokens, passwords. Exception filter logs stack — check that stack doesn't contain request body.
- **CI gates (T-4807)**: `pnpm secrets:check` scans tracked files for high-confidence key patterns (PEM keys, AWS/GCP/Slack/GitHub/Stripe tokens); Gitleaks scans full git history; Trivy scans Dockerfiles (config) and the API image for CRITICAL/HIGH CVEs. All three block the build and publish SARIF reports as artifacts. Locally the same secret gate runs as a pre-commit hook (`pnpm hooks:install` sets `core.hooksPath=hooks`). False positives go into an allowlist with a reason (`.gitleaks.toml`, `scripts/check-secrets.mjs`), never by disabling the check.

## 3. Input and limits (check in each new task)

- Coordinates, codes, sums — validated **in domain** (VO: `Coordinates`, `OpeningHours`), controller only maps errors to HTTP statuses; control point — `locations-http.mapper`.
- External calls — with timeout (3s in geocoders) and degradation to null/empty list; external response parsed in try/catch, never trusted as type.
- Rate limiting for public booking — at T-042 start (together with idempotency); external ACL limits — already in code (`CachedRateLimitedGeocoder`).

## 4. New task checklist (without this — not ready for review)

1. New `/admin/*` endpoints protected by global guard (if not — why exactly and entry in `PUBLIC_ADMIN_AUTH` justified).
2. Secrets only via env; in repo — only `.env.example` without values.
3. Public response doesn't contain service fields; errors — without stacks and internal paths.
4. Logs don't contain PII/secrets (coordinates, codes, tokens).
5. External call has timeout and provider failure behavior.
6. Migrations: NOT store secrets/PII in JSON columns without need; OTP — only hashes.

## 5. What consciously NOT here (outside T-4210)

WAF/Cloudflare, bot detection, credential-stuffing checks, MFA, CSP headers, distributed rate limit — these items make sense at phase 30 with real traffic; their decisions fixed in T-4210, not in this document.
