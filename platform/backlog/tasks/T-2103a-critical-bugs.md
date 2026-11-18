# T-2103a · Критичні баги (8/25)

- **Stage**: M5 (phase 30) · **Tags**: frontend, quality, high-risk · **Complexity**: senior · **Depends on**: T-004, T-030, T-070
- **StoryPoints**: 8

## What
Fix критичні баги, що блокують користувача: crashes, data loss, security, payment failures, auth loops. Пріоритет P0 — фіксити за 24–48 год. Регресійні Tests для кожного фіксу.

## Why
Критичні баги блокують бізнес. Швидкий фікс — мінімізація впливу. Tests запобігають повторенню.

## Sources
- GitHub Issues (label: critical)
- docs/testing-guidelines.md — реальний документ з 2026-09-24 (конвенції за фактичним кодом)
- Sentry/логги

## Done
- [ ] Всі P0 закриті
- [ ] Регресійні Tests додані
- [ ] Post-mortem для топ-3