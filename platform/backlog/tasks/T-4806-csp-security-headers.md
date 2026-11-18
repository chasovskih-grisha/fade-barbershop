# T-4806 · Content Security Policy (CSP) & Secure HTTP Headers Hardening

- **Stage**: M3 · **Tags**: frontend, security, devops · **Complexity**: middle · **Depends on**: T-002, T-030
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

- [ ] Next.js middleware implementing cryptographic nonces and strict CSP headers
- [ ] HSTS and secure transport headers configured in API gateway / reverse proxy
- [ ] Automated security header scan passing Mozilla Observatory with A+ grade
- [ ] Regression test suite verifying that CSP policies do not block legitimate widgets or analytics

## Risks

- [ ] **Third-party scripts**: Breaking external analytics (GTM/Amplitude) if CSP rules are overly restrictive.
