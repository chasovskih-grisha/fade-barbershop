# T-4592 · `page_view` для SPA: роутер, динамічні маршрути, перехід на `/booking`

- **Stage**: M3 (phase 3 — сайт) · **Tags**: frontend, analytics, marketing · **Complexity**: middle · **Depends on**: T-4591, T-4595, T-4508, T-053
- **StoryPoints**: 3

## What

Коректний облік переходів у Next.js App Router з одним джерелом істини — роутером застосунку. GTM **не** отримує History Change тригер.

### Джерело `page_view`
- Клієнтський компонент `<PageViewTracker />` (у `src/lib/analytics/`, монтується в RootLayout) читає `usePathname()` + `useSearchParams()` і пушить `page_view` через контракт T-4595.
- Guard від подвійного спрацювання: `useRef` на останній шлях + порівняння з поточним `page_location` (React StrictMode у dev викликає effect двічі). Одна навігація — рівно один `page_view`.
- Дедуплікація: два послідовні однакові шляхи → другий пуш ігнорується; `hash` не входить у `page_location` (прибирає шум від `README.md#L42`).
- SSR-навігація не породжує серверний `page_view` (GA4 — клієнтський інструмент); перший пуш відбувається після гідратації. Це зафіксована поведінка, а не баг.

### `page_location` і параметри
- `page_location` = канонічний абсолютний URL `fade.com.ua` (запис — той самий хост, шлях `/booking`).
- **Allowlist** query-параметрів у `page_location`: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `location`, `service`, `barber`, `ref`, `page`, `lang`.
- **Denylist (обов'язково вирізати)**: `phone`, `code`, `token`, `otp`, `email` — інакше OTP-код із `/login?code=…` або телефон у URL потраплять у GA4 (T-4601). Реалізація: `new URL()` + фільтр, не regex по рядку.
- Динамічні маршрути `/locations/[code]`, `/barbers/[slug]` → у `page_location` конкретний URL, окремо `location_code` / `barber_slug` як параметри події (T-4594).

### Перехід на `/booking`
- `cta_booking_click` (T-4596) пише контекст переходу в `sessionStorage`: `entry_point`, `session_id`, `utm_*`, `ts`.
- Перший `page_view` на шляху, що починається з `/booking`, читає цей контекст, додає `entry_point` і **видаляє** запис (одноразово). Прямий вхід без кліку → `entry_point = 'direct'`.
- Окремого cross-domain linking none: вітрина і запис — один хост, одна GA4-сесія. `session_id` лишається в `sessionStorage` лише для `entry_point` (T-4602).

## Why

Перехід на `/booking` — звичайна навігація того самого хоста. Без `entry_point` і UTM на візиті не видно, звідки прийшов запис. History Change тригер у GTM разом із власним пушем дає подвійний `page_view` на кожному переході — найпоширеніша помилка SPA-аналітики.

## Sources

- T-053 — `fade.com.ua/booking`, UTM-парсер на вході (`utm_content=direct` за замовчуванням)
- T-4508 — SEO-requirements до метаданих і канонічних URL
- `products.md` §1
- T-4590 (один контейнер на `fade.com.ua`), T-4593 (один data stream, без cross-domain для booking)

## Done

- [ ] Одна навігація = рівно один `page_view` (Playwright: лічильник пушів, T-4602)
- [ ] Dev-режим (StrictMode) не дає двох `page_view` на одному шляху
- [ ] Послідовний дубль шляху ігнорується; `hash` не потрапляє в `page_location`
- [ ] `/login?code=123456` → у `page_location` none `code`; дозволені `utm_*` зберігаються
- [ ] `/locations/dnipro` і `/barbers/ivan` дають конкретний URL + `location_code`/`barber_slug`
- [ ] Перехід на `/booking`: у GA4 та сама сесія, у `page_view` є `entry_point`
- [ ] Прямий вхід на `/booking` без кліку: `entry_point = 'direct'`, `utm_content = 'direct'` (за T-053)
- [ ] `sessionStorage`-контекст переходу видаляється після першого пушу (повторне відкриття не дублює `entry_point`)

## Risks

- [ ] **SSR/кеш**: `fade.com.ua` — серверні сторінки; кеш/CDN не має бути ввімкнений для відповідей, залежних від consent (cookies) — узгодити з T-4508
- [ ] **`useSearchParams` у Next 14**: клієнтський хук вимагає `<Suspense>` на SSR-сторінках — Verify збірку, інакше помилка при статичному рендері
- [ ] **`/booking` до релізу T-053**: поки маршрут не віддає quick-flow, `entry_point` пишеться на кліку, але сторінка ще не читає його — не вважати це багом
