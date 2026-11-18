# T-001b · CORS and Domain Configuration (3/11)

- **Stage**: M0 (phase 0) · **Tags**: infra, devops · **Complexity**: middle · **Depends on**: T-001a
- **StoryPoints**: 3

## What
Configure CORS: явний allowlist браузерних origin (fade.com.ua, admin.fade.com.ua, api.fade.com.ua, shop.fade.com.ua, media.fade.com.ua) per ADR 0017. Домени: `fade.com.ua` (showcase and `/booking`), `shop.fade.com.ua`, `admin.fade.com.ua`, `api.fade.com.ua`, `media.fade.com.ua`. Окремого origin `book.fade.com.ua` none (revision 2026-10-01).

## Why
Чеклиsт v1: «Domain, SSL, mail». CORS потрібен для sпільної sеsії `.fade.com.ua`.

## Sources
- ADR 0017 (domains/SSL)
- `docs/architecture.md` §CORS

## Done
- [x] CORS policy fixed (allowlist + env)
- [x] Domains added to allowlist

## dependencies
- T-001c (CI pipeline)