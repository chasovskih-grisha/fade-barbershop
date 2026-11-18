# T-4577 · Public Website Analytics (Amplitude) — Acquisition Funnel

- **Stage**: M3 (phase 3 — сайт) · **Tags**: frontend, analytics, marketing · **Complexity**: junior · **Depends on**: T-4575, T-4576, T-030, T-4402
- **StoryPoints**: 5

## What

Реалізація Amplitude трекінгу на публічному сайті (`apps/web`) — заміна/доповнення GA4/Meta Pixel (T-4403). Трекаємо acquisition воронку до моменту входу/запису.

### Події (згідно T-4576 таксономії)

| Подія | Тригер | Властивості |
|-------|--------|-------------|
| `page_view` | Кожен route change (Next.js router) | `page_name`, `page_path`, `referrer`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `location_code?` |
| `cta_booking_click` | Клік по кнопці «Записатися» / CTA запису | `cta_location` (hero, header, location_card, service_card, barber_card, blog_footer), `location_code?` |
| `location_select` | Клік «Обрати» на картці локації | `location_code`, `location_name` |
| `service_view` | Перегляд картки послуги (hover/фокус > 1с або клік) | `service_id`, `service_name`, `price`, `duration`, `location_code` |
| `barber_view` | Перегляд картки барбера | `barber_id`, `barber_name`, `location_code` |
| `article_view` | Відкриття статті блогу | `article_slug`, `article_title`, `read_time_estimate` |
| `phone_click` | Клік по `tel:` посиланню (header/footer) | `phone_number`, `page_path` |

### Імплементація

**Web (`apps/web`):**
- Хук `useAmplitude()` в `src/lib/analytics/amplitude.ts` — wrapper над `amplitude.track()`
- `AnalyticsProvider` в `layout.tsx` (після AuthProvider) — ініціалізація SDK, слухач `router.events` для `page_view`
- У компонентах: імпорт хуку, виклик `track('event_name', props)` на onClick/onView
- UTM параметри: парсинг з URL при першому заході (`useEffect` в AnalyticsProvider), збереження в `localStorage`/`cookie` для сесії
- **Consent**: SDK ініціалізується ТІЛЬКИ після `cookie_consent_analytics = true` (T-4402). До згоди — чергуємо події в пам'яті, флашим після згоди.

### Acceptance Criteria

- [ ] `page_view` стріляє на всіх публічних маршрутах (`/`, `/locations`, `/locations/[code]`, `/services`, `/barbers`, `/barbers/[slug]`, `/blog`, `/blog/[slug]`, `/login`)
- [ ] `cta_booking_click` фіксує всі CTA кнопки запису з правильним `cta_location`
- [ ] UTM параметри прокидаються в `page_view` і `booking_started` (після переходу на `/booking`)
- [ ] Відмова cookie-банера = жодної події в Amplitude (перевірка в Network tab / Amplitude Live)
- [ ] Події відображаються в Amplitude Live за < 10с

## Why

Acquisition funnel — основа для розрахунку CAC, LTV, ROI по каналах. Amplitude дає кращу ідентифікацію користувачів ніж GA4 (cross-device по user_id).

## Sources

- products.md §1 (публічні сторінки, CTA запису)
- web-cabinet-screens.md §1 (аналітика: «успішний OTP», «CTA запису»)
- T-4403 (GA4/Meta Pixel — ми переносимо в Amplitude)
- booking-flow.md крок 0 (location selection)

## Done

- [ ] `AnalyticsProvider` в `apps/web/src/app/layout.tsx` (lazy init за згоди)
- [ ] `useAmplitude` хук в `apps/web/src/lib/analytics/amplitude.ts`
- [ ] `page_view` на всіх публічних сторінках (router listener)
- [ ] `cta_booking_click` на всіх CTA кнопках запису
- [ ] `location_select`, `service_view`, `barber_view`, `article_view`, `phone_click`
- [ ] UTM persistence в cookie/localStorage (TTL 30 днів)
- [ ] Consent gating: без згоди — не ініціалізуємо SDK

## Risks

- [ ] **SSR/Next.js**: `amplitude.track` тільки client-side — обгортати в `useEffect` / `typeof window !== 'undefined'`
- [ ] **AdBlock**: частина подій не доїде — критичні дублювати server-side (T-4587)
- [ ] **PII в UTM**: `utm_content` може містити PII — санітизувати/не логувати raw