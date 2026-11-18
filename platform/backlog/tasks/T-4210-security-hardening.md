# T-4210 · Hardening безпеки

- **Stage**: M5 (phase 30) · **Tags**: backend, security, devops, high-risk · **Complexity**: senior · **Depends on**: T-3600, T-3802, T-3803
- **StoryPoints**: 25

## What
Production hardening: **WAF** — Cloudflare/AWS WAF / ModSecurity, OWASP CRS 3.3+, кастомні правила (SQLi, XSS, RCE, LFI), virtual patching; **Rate limiting** — per endpoint (адаптивно), per user (token bucket), per IP (sliding window), per tenant, розподілено (Redis), винятки для health/webhooks; **Детекція ботів** — reCAPTCHA v3 / Cloudflare Turnstile / honeypot-поля / JA3 fingerprinting, challenge-сторінки; **Credential stuffing** — перевірка зламаних паролів (HaveIBeenPwned), блокування акаунтів, примусовий MFA; **Зловживання API** — квоти per key, spike arrest, детекція аномалій (незвичні ендпоінти/параметри); **Security-заголовки** — CSP (strict-dynamic, nonce), HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP/COEP; **Secrets** — Vault/Sealed Secrets, ротація, динамічні credentials.

## Why
Production без WAF/rate limiting = відчинені двері. Бот-трафік = 40%+ веб-трафіку. Credential stuffing = перехоплення акаунтів.

## Sources
- docs/security-hardening.md — реальний документ з 2026-09-24 (базовий рівень у коді: auth/сесії/секрети/чекліст; WAF, MFA, бот-детекція — приймаються на старті задачі)
- OWASP ASVS / CRS
- Cloudflare WAF / ModSecurity

## dependencies
> Слайси виділяються при старті задачі; окремі файли підзадач створюються тоді ж за потреби.
