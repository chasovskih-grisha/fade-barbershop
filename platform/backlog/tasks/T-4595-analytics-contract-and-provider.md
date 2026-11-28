# T-4595 · Спільний контракт подій і `AnalyticsProvider`: один пуш — два напрями

- **Stage**: M2 (перед фазою 3 — сайт) · **Tags**: frontend, analytics, integration · **Complexity**: middle · **Depends on**: T-4575, T-4576, T-4591
- **StoryPoints**: 5

## What

Єдине місце, з якого application відправляє аналітику: типізований контракт подій у `packages/contracts` + один провайдер у `apps/web`, який з одного пушу живить і `dataLayer` (→ GTM → GA4), і Amplitude.

### Контракт (`packages/contracts/src/analytics/`)
- `EventName` — union з іменами T-4576 (джерело імен), без розбіжностей.
- `EventDef` для кожної події: `name`, `params` (типи), `emission: 'client' | 'server'`, `ga4: { send: boolean; priority: 'P1' | 'P2' }`, `allowInAdmin: boolean`.
- **Матриця вимірювання** (`emission`) — обов'язковий бік контракту, не коментар: подія в GA4 надсилається з одного sources (клієнт **або** сервер), ніколи з обох.
- Спільні для всіх подій: `event_id` (uuid), `insert_id` (dedupe), `session_id`, `anon_id`, `user_id?`, `env`, `consent_state`, `ts`.
- Аналітика = контракт у репо ⇒ GTM, Amplitude, серверний outbox читають одне джерело правди; розбіжність contract ↔ dataLayer стає помилкою CI (T-4601).

### Провайдер (`apps/web/src/lib/analytics/`)
- `dataLayer.ts` — `pushEvent(name, params)`: єдиний виклик `window.dataLayer.push` + виклик Amplitude `track`. Жодного іншого місця в коді не зобов'язано пушити.
- `session.ts` — `session_id` (uuid на сесію), `anon_id`, `entry_point`-ctx (sessionStorage).
- `identity.ts` — `setUserId(uuid)` після OTP + `identify` (merge anon→user, T-4575).
- `AnalyticsProvider.tsx` — клієнтський компонент у `RootLayout`; **замінює** пряму ініціалізацію Amplitude у layout з T-4575.
- Середовище: `debug_mode` додається тільки для `staging`/Preview.

## Why

Два незалежні вимірювання змагаються за одні й ті самі моменти. Якщо web-подія йде в GA4 напряму з компонента, а в Amplitude — з хука, то через місяць вони розходяться в 3–5 разів, і ніхто не знає, які цифри правильні. Один контракт + один push змушує обидва напрями бачити ту саму подію з тими самими id — це і робить звірювання з DB можливим (T-4603).

## Sources

- T-4576 — схема подій (джерело правди), T-4575 — SDK, T-4578 — identity
- T-4591 (bootstrap), T-4600 (consent), T-4601 (PII)
- `docs/decisions/*` — жодного прямого; рішення про один push фіксується тут

## Done

- [ ] `EventName`/`EventDef` у `@fade/contracts` збігаються з T-4576; розбіжності (напр. `booking_failed`) зафіксовані як back-port у T-4576
- [ ] Кожна подія має `emission` і прапорець `ga4.send` — жодної події «за замовчуванням»
- [ ] `pushEvent` — єдиний виклик `dataLayer.push` у `apps/web` (grep-перевірка, T-4601)
- [ ] Один пуш → і dataLayer, і Amplitude (одна й та сама подія, ті самі `event_id`/`insert_id`)
- [ ] `AnalyticsProvider` у `RootLayout`, пряма ініціалізація Amplitude з layout прибрана
- [ ] `user_id` виставляється після OTP + `identify` merge; `session_id` стабільний у межах сесії
- [ ] `debug_mode` лише для staging/Preview
- [ ] Юніт-Tests: пуш не відбувається без згоди; пуш робиться рівно один раз на виклик; `emission: 'server'` подія з клієнта **не** пушиться в dataLayer (захист від подвійного рахунку)

## Risks

- [ ] **Дві копії імен у репо**: контракт і T-4576 розійдуться — тому T-4576 правиться разом (back-port), а не «потім»
- [ ] **Amplitude `identify` vs GA4 user_id**: GA4 приймає `user_id` лише з браузера/Measurement Protocol, не зі змінної dataLayer у конфіг-тезі — підіймається тільки в event-тегах (T-4596)
- [ ] **Зміна контракту ламає GTM**: перейменування параметра без синхронного оновлення Variable у контейнері дає `(not set)` — контейнер і контракт версійуються разом (T-4590)
- [ ] **TS-типи vs GTM**: контракт не валідовує GTM-tags автоматично — це закриває тільки T-4602 (GA4 DebugView)
