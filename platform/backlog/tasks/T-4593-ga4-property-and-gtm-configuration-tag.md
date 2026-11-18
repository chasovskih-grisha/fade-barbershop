# T-4593 · GA4-властивість і тег GA4 Configuration у GTM

- **Stage**: M2 (перед фазою 3 — сайт) · **Tags**: analytics, integration, marketing · **Complexity**: middle · **Depends on**: T-4590
- **StoryPoints**: 5

## What

Створення GA4-властивості та одного базового тегу, через який піде **весь** клієнтський трафік і всі event-tags.

### Властивість і data stream
- Властивість `Fade Web` (GA4), один Web data stream на `fade.com.ua` і `www.fade.com.ua`. Запис — шлях `/booking` на тому самому хості, тож сесія не рветься. `shop.fade.com.ua`, коли з'явиться, додається в cross-domain окремо.
- `admin.fade.com.ua` у data stream **не** входить (внутрішній трафік, T-4601).
- Властивості: reporting time zone `Europe/Kyiv`, currency `UAH`, data retention `14 місяці` (максимум; коротше не дає аналізувати сезонність ріку).

### Тег GA4 Configuration
- Один тег `GA4 - Config`, джерело `Measurement ID` — Data Layer Variable (щоб staging/live розходилися значенням, а не двома тегами).
- **«Send page view» — ВИМКНЕНО** (обов'язково): `page_view` приходить одним пушем із роутера (T-4592), інакше кожен перехід рахується двічі.
- **Link session across domains** для booking не вмикається: `/booking` — той самий хост. Список лишається порожнім, доки none `shop.fade.com.ua`. Cookie domain `auto`.
- Transport: `beacon` (більш надійний `sendBeacon` при навігації).
- Consent settings: `Wait for update` 500 ms, `Require additional consent for analytics` — за T-4600.

### Enhanced Measurement (у property, не в GTM)
- Page views: **ON** (GA4 сам доганяє перший page view, якщо пуш не дійшов — страховка).
- Scroll depth, site search, file downloads, form interactions, outbound clicks: **OFF** — усе міряємо власними пушами, автотригери GTM дублюють (див. T-4596).

### Debug-режим
- `debug_mode: true` додається у події лише для `staging` і GTM Preview (через DLV `environment`) — GA4 виключає такі події зі стандартних звітів.
- Перевірка: GA4 **DebugView** (streaming, ~1–3 с) + **Realtime** (до 30 с).

## Why

Тег GA4 Configuration — це точка, де зазвичай помиляються двічі: увімкнений «Send page view» дає подвоєні перегляди, а вимкнений Enhanced Measurement «на всяк випадок» додає третій дубль. Один тег, чітко описаний, дає передбачувані цифри, з якими можна звіритись із DB на запуску (T-4603).

## Sources

- `products.md` §1, `roadmap.md` phase 14
- T-4590 (контейнер і оточення), T-4591 (bootstrap), T-4592 (єдиний `page_view`)
- T-4403 (GTM/GA4 не реалізовані)

## Done

- [ ] Створено властивість `Fade Web` + один Web data stream на `fade.com.ua` і `www.fade.com.ua`
- [ ] Reporting time zone `Europe/Kyiv`, currency `UAH`, retention `14 місяці`
- [ ] `admin.fade.com.ua` відсутній у data stream
- [ ] Тег `GA4 - Config` створено, `Send page view` = OFF, `Measurement ID` з DLV
- [ ] Cross-domain linking для booking вимкнено (один хост); `shop.fade.com.ua` у список не входить, доки магазину none
- [ ] Consent settings: `wait_for_update = 500`, вимога згоди для analytics
- [ ] Enhanced Measurement: увімкнено тільки page views
- [ ] DebugView показує `page_view` після навігації на staging (з `debug_mode`)
- [ ] Перший page view приходить навіть з вимкненим JavaScript (страховка Enhanced Measurement) — перевірено в Realtime
- [ ] Скриншоти налаштувань (property + data stream + тег) прикріплено до задачі

## Risks

- [ ] **`_ga` cookie на двох доменах**: якщо cookie domain звузиться до одного хоста, сесія рветься на переході — перевіряється в T-4602
- [ ] **Enhanced Measurement page_views ON + власний пуш**: страховка не дублює, бо «Send page view» вимкнено; рахувати подвійно почне лише повторне ввімкнення
- [ ] **Retention**: 14 місяців — максимум GA4; після 14 місяців зникають лише сирі події, агрегати лишаються
- [ ] **`wait_for_update`**: довше 500 мс користувач може встигнути отримати подію без згоди — тому гейт на рівні завантаження (T-4591), а не тільки на рівні тега
