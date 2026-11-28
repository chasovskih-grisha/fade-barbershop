# T-3804 · Інженерія продуктивності

- **Stage**: M6 (phase 40) · **Tags**: frontend, high-risk · **Complexity**: senior · **Depends on**: T-001, T-002, T-3803
- **StoryPoints**: 30

## What
Performance Engineering: CWV-бюджети (LCP/INP/CLS) у CI, k6 load/soak Tests API, synthetic + RUM моніторинг, алерти на регресії в CI, профілювання гарячих шляхів (запис, слоти, оплата).

## Why
Швидкість — конверсія запису. Цілі quick-booking (LCP < 1.5 с на 3G) неможливо утримати без бюджетів у CI і RUM-факту.

## Sources
- `docs/engineering-principles.md` (гейти якості), ADR 0019
- T-053 (цілі LCP/JS-бюджет)

## dependencies

> Слайси виділяються при старті задачі; окремі файли підзадач створюються тоді ж за потреби.
## Чекліст
- [ ] CWV-бюджети на ключові сторінки, гейт у CI
- [ ] k6 load/soak сценарії для API (піки: ранок/вечір, вітальне M0)
- [ ] Synthetic-моніторинг book/admin/api
- [ ] RUM (Web Vitals → аналітика)
- [ ] Алерти на регресії p95
- [ ] Профілювання слотів і оплати (гарячі шляхи)
