# T-4806 · Content Security Policy (CSP) & Secure HTTP Headers Hardening

- **Stage**: M3 · **Tags**: frontend, security · **Complexity**: middle · **Depends on**: T-002, T-030
- **StoryPoints**: 5

## What

Harden web (`apps/web`) and admin (`apps/admin`) applications by implementing strict Content Security Policy (CSP) headers, HTTP Strict Transport Security (HSTS), X-Frame-Options, X-Content-Type-Options, and secure cookie attributes.

- Configure nonces for inline scripts and styles in Next.js middleware.
- Define robust CSP directives restricting script sources, connect-src, and frame-ancestors.
- Enforce `SameSite=Strict` and `Secure` flags on all authentication cookies.

## Why

Protect web applications against Cross-Site Scripting (XSS), Clickjacking, and session hijacking vulnerabilities prior to public production launch.

## Sources

- `platform/docs/security-hardening.md`
- `platform/docs/engineering-principles.md`

## Done

- [x] `apps/web/src/middleware.ts` and `apps/admin/src/middleware.ts` set a per-request `Content-Security-Policy` with a 16-byte nonce and `strict-dynamic` (policies in each `src/lib/csp.ts`), committed at `review: T-4806`
- [x] `middleware.test.ts` in both apps (7 tests): header + `x-nonce` agreement, nonce freshness, `script-src` has no `unsafe-inline`/foreign origin, matcher excludes `_next/static`

## Slices

- T-4806a — transport headers at the gateway and the Mozilla Observatory A+ scan: both need the
  public deployment and the owner's infrastructure, so they are verified there, not in this repo.

`next.config.js` already sends HSTS, `X-Frame-Options`, `X-Content-Type-Options`,
`Referrer-Policy` and `Permissions-Policy` for both apps (verified 2026-11-26). Those stay; this row
adds the per-request policy the static headers cannot express.

## Risks

- [ ] **Third-party scripts**: Breaking external analytics (GTM/Amplitude) if CSP rules are overly restrictive.

## Implementation plan

Paths:
- apps/web/src/middleware.ts
- apps/web/src/lib/csp.ts
- apps/web/src/__tests__/middleware.test.ts
- apps/admin/src/middleware.ts
- apps/admin/src/lib/csp.ts
- apps/admin/src/__tests__/middleware.test.ts

Checks:
- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/__tests__/middleware.test.ts`

## Implementation notes

- apps/admin/src/__tests__/middleware.test.ts
- apps/admin/src/lib/csp.ts
- apps/admin/src/middleware.ts
- apps/web/src/__tests__/middleware.test.ts
- apps/web/src/lib/csp.ts
- apps/web/src/middleware.ts

## QA

- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/__tests__/middleware.test.ts` exit 0
