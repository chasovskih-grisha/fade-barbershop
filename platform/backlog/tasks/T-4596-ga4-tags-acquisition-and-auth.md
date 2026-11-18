# T-4596 · GTM/GA4-tags вимірювання: acquisition та authorization

- **Stage**: M3 (phase 3 — сайт, паралельно з фазою 6 — mobile) · **Tags**: frontend, analytics, marketing, identity · **Complexity**: middle · **Depends on**: T-4593, T-4595, T-4577, T-4578
- **StoryPoints**: 5

## What

Клієнтські GA4-tags для верхів воронки: перегляди сторінок, кліки в запис, телефон, каталог, і весь OTP-флоу. Специфікація кожної події — нижче; усе йде з одного пушу (T-4595), GTM лише мапить у GA4.

### Acquisition

| Подія | Тригер | Параметри | Ідентифікатори | GTM-реалізація | Мапінг у GA4 | Де спрацьовує | Критерій приймання |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page_view` | зміна маршруту | `page_location`, `page_path`, `page_referrer`, `page_title`, `location_code?`, `barber_slug?`, `entry_point`, `utm_*`, `session_id`, `anon_id`, `user_id?`, `consent_state` | `session_id`, `anon_id`, `user_id?` | GA4 Event тег, Custom Event `page_view`; **без** History Change | `page_view` (GA4-подія) | `src/lib/analytics/PageViewTracker.tsx` (T-4592) | 1 пуш = 1 подія в DebugView; `page_location` без `code`/`phone` |
| `cta_booking_click` | клік по CTA «Записатися» | `entry_point='booking_cta'`, `cta_location` (`hero`/`services`/`location_card`), `page_location`, `utm_*` | `session_id`, `anon_id` | GA4 Event тег | окрема подія + **мікро-conversion** (див. примітку) | `src/app/page.tsx` (hero CTA), `src/app/services/page.tsx`, `src/app/locations/[code]/page.tsx` | клік = 1 подія; `sessionStorage` отримує ctx для `/booking` |
| `phone_click` | клік по `tel:` | `location_code`, `page_location`, `entry_point` | `session_id`, `anon_id` | GA4 Event тег | `phone_click` | `src/app/locations/page.tsx`, `src/app/locations/[code]/LocationChannels.tsx` | клік по картці і по шапці локації дає одну подію кожен; **номер телефону в параметрах відсутній** |
| `location_select` | вибір локації зі списку | `location_code` | `session_id`, `anon_id` | GA4 Event тег | `location_select` (P2) | `src/app/locations/page.tsx` | фільтр по `location_code` дає очікувані коди |
| `service_view` | перегляд картки послуги | `service_id`, `service_name`, `price` | `session_id`, `anon_id` | GA4 Event тег | `service_view` (P2) | `src/app/services/page.tsx` | фільтр по `service_id` збігається з каталогом |
| `barber_view` | відкриття картки барбера | `barber_slug` | `session_id`, `anon_id` | GA4 Event тег | `barber_view` (P2) | `src/app/barbers/[slug]/page.tsx` | запис на 1 барбера = 1 подія |
| `article_view` | відкриття статті блогу | `article_slug`, `article_tag` (перший тег, якщо є; категорії none) | `session_id`, `anon_id` | GA4 Event тег | `article_view` (P2) | пуш зі сторінки — **T-2300h**; тег GTM лишається тут | не блокує запуск; до T-2300h подія в контракті, але не шлеться зі статті |

### authorization (`src/app/login/page.tsx`)

| Подія | Тригер | Параметри | Ідентифікатори | GTM-реалізація | Мапінг у GA4 | Де спрацьовує | Критерій приймання |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `auth_phone_submitted` | `requestOtp(phone)` успішно | `has_previous_user` (bool) | `anon_id` | GA4 Event тег | `auth_phone_submitted` | `LoginPage.handlePhoneSubmit`, у `then` | телефон у параметрах **відсутній**; подія до переходу на крок коду |
| `auth_otp_submitted` | `verifyOtp(phone, code)` успішно | `has_previous_user` | `anon_id`, `user_id` (одразу після `login()`) | GA4 Event тег | `auth_otp_submitted` | `LoginPage.handleCodeSubmit`, у `then` до `router.push` | 1 пуш на спробу; OTP-код у параметрах відсутній |
| `auth_otp_verified` | сесія встановлена | `has_previous_user` | `user_id`, `anon_id` | GA4 Event тег + **Key event** | `auth_otp_verified` | той самий `then`, після `login(token, user)` | DebugView: 1 подія з `user_id`; звіт «Key events» GA4 показує її |
| `auth_otp_failed` | `verifyOtp` 4xx | `error_code` (`INVALID_CODE`/`EXPIRED`/`RATE_LIMITED`) | `anon_id` | GA4 Event тег | `auth_otp_failed` | `LoginPage.handleCodeSubmit`, у `catch` | сирий текст помилки API **не** передається (T-4601) |
| `auth_otp_request_failed` | `requestOtp` 4xx | `error_code` | `anon_id` | GA4 Event тег | окрема подія | `handlePhoneSubmit`, у `catch` | рахується окремо від `auth_otp_failed` (різні кроки) |
| `auth_logout` | `AuthProvider.logout()` | — | `user_id` | **не** налаштовується | подія лише в Amplitude | `AuthProvider.logout` | у GA4 нуль подій logout (навіщо нам виходи з кабінету в рекламному звіті) |

**Примітка про мікро-conversion:** у GA4 «conversion» — це позначка в адмінці, тому `cta_booking_click` і `phone_click` реєструються як звичайні події з `ga4.send = true`, але **не** як key events; key event лише у T-4598.

## Why

Верх воронки — це те, за що платять рекламодавці. Без `page_view` + `cta_booking_click` + `phone_click` неможливо порахувати ні вартість ліда, ні атрибуцію запису, ні «скільки людей дзвонили замість онлайн-запису» (важлива метрика для барбершопу з великим потоком трафіку). OTP-флоу — це не маркетинг, а health-check: якщо падає `auth_otp_verified`, падає запис (телефон — ідентифікатор клієнта в цій бізнес-моделі).

## Sources

- `products.md` §1 — «просмотр статей, переход по кнопке записи, успешный OTP, клик по телефону»
- T-4577 (baseline web), T-4578 (auth), T-4576 (імена і схема)
- T-4508 (URL/міта), T-4536 (канал), T-4588 (PII), T-4593 (тег конфіг), T-4595 (контракт)

## Done

- [ ] Усі P1-події acquisition/auth мають GA4-тег; P2 — зареєстровані, але не блокують запуск
- [ ] Жоден GTM auto-тригер (Scroll Depth, Outbound Links, Form Submission) не використовується — інакше дублі з пушами
- [ ] Усі кліки CTA (hero, services, card локації) дають `cta_booking_click` з `cta_location`
- [ ] `phone_click` без номера телефону в параметрах
- [ ] OTP: `auth_phone_submitted` → `auth_otp_submitted` → `auth_otp_verified`; жодного OTP-коду в dataLayer
- [ ] `auth_otp_verified` присутній у GA4 Key events (після T-4598)
- [ ] `auth_logout` і `booking_abandoned` у GA4 не потрапляють (зафіксовано як свідоме рішення)
- [ ] Звіряння: 100 сесій на staging → очікувані лічильники DebugView по кожній події
- [ ] Автотест (jest/jsdom): клік по CTA пушить `cta_booking_click` рівно один раз

## Risks

- [ ] **GTM auto-тригери**: «просто увімкнемо Outbound Links» зруйнує рахунок — контроль у Done
- [ ] **Поверхня статті вже є, пуша none**: `article_view` і `cta_location=article` належать T-2300h; цей рядок лише тримає контракт події. Категорії в блозі none — параметр `article_tag`
- [ ] **`has_previous_user`**: обчислюється клієнтом як «був `user_id` у цій сесії раніше» — наближення, не істина; API не повертає ознаку нового користувача
- [ ] **Два кроки OTP**: плутанина `auth_phone_submitted` vs `auth_otp_submitted` (обидва в T-4576) → у GA4 це різні події, у воронці — один крок
