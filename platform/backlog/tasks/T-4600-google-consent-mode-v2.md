# T-4600 · Google Consent Mode v2

- **Stage**: M2 (перед фазою 3 — сайт) · **Tags**: analytics, legal, privacy, integration, backend · **Complexity**: middle · **Depends on**: T-4402, T-4588, T-4591, T-4593
- **StoryPoints**: 5

## What

Формалізація згоди для Google-стек: `denied` за замовчуванням, оновлення при кожній зміні рішення, синхронізація з GTM/GA4, плюс GPC (Global Privacy Control) як окремий сигнал.

### Сигнали (таблиця за замовчуванням)
| Сигнал | За замовчуванням | Ким керує користувач |
| --- | --- | --- |
| `analytics_storage` | `denied` | банер згоди (T-4402) |
| `ad_storage` | `denied` | банер згоди |
| `ad_user_data` | `denied` | банер згоди |
| `ad_personalization` | `denied` | банер згоди |
| `functionality_storage` | `granted` | — (технічно потрібне для сесії) |
| `personalization_storage` | `denied` | банер згоди |
| `security_storage` | `granted` | — |

### Поведінка
- `consent: 'default'` пушиться **перед** `gtm.js` (bootstrap, T-4591). Порядок критичний: GTM читає дефолти в момент завантаження.
- `consent: 'update'` при кожній зміні: «Прийняти всі», «Відхилити», зміна категорії в «Налаштуваннях», а також `migrate` при відкритті сторінки, коли рішення вже є в `localStorage`.
- `wait_for_update = 500` мс на рівні GA4 Config (T-4593) — не більше, щоб не втрачати події.
- **GPC**: якщо браузер надсилає `Sec-GPC: 1` — усі сигнали примусово `denied`, банер не перебиває вибір користувача.
- У GA4 Config увімкнено вимогу додаткової згоди для analytics; у GTM увімкнено шаблон Consent Mode (Consent defaults → Consent update).
- `ads_data_redaction` **увімкнено** (редагування ad-click ідентифікаторів, `gclid`, зберігаючи модельну атрибуцію); `url_passthrough` **вимкнено** — `page_location` формуємо самі (T-4592).

## Why

GA4 за замовчуванням ставить cookie і шле дані до згоди, якщо його просто вставити в тег. T-4402 вимагає прямо протилежного («трекери не завантажуються до згоди»), тому ми поєднуємо дві речі: жорсткий гейт на завантаження (T-4591) **і** Consent Mode v2 як ешелон — якщо порядок пушів колись зламається, дефолт `denied` усе одно не пропустить подію. Свідомий компроміс: без cookieless-трафіку ми втрачаємо модель конверсій Google на відмовлених — для «10 секунд до запису» це прийнятно.

## Sources

- T-4402 (банер згоди, «трекери не завантажуються до згоди»), T-4588 (privacy)
- T-4591 (bootstrap), T-4593 (тег конфіг), T-4598 (аудиторії/export)

## Done

- [ ] `consent: 'default'` з `analytics_storage: 'denied'` пушиться до `gtm.js` (перевірено в порядку Network)
- [ ] Відмова → у Network none жодного звернення до `google-analytics.com` / `googletagmanager.com`
- [ ] Згода → звернення є; повторна зміна рішення не перезавантажує `gtm.js`
- [ ] Сторінка «Налаштування» (категорії) оновлює сигнали; `migrate` при повторному візиті
- [ ] GPC = 1 → примусовий `denied`, перевірено в DevTools → Application → Cookies
- [ ] GTM: Consent Mode template active, `wait_for_update = 500`
- [ ] `ads_data_redaction` on, `url_passthrough` off
- [ ] Tag Assistant → Consent Mode: жодних попереджень
- [ ] Різниця «згода → 0 подій» і «відмова → 0 подій» зафіксована в `docs/analytics.md` (файл не створено — створюється в T-4604)

## Risks

- [ ] **Порядок пушів**: `default` після `gtm.js` = тег стартує без згоди; це рівно те, що захищає T-4591
- [ ] **`migrate` не враховує GPC**: migration з `localStorage` не повинна перебивати GPC — пріоритет у GPC
- [ ] **Різниця лічильників** «до/після» consent-loss: GA4 показує менше подій, ніж реально відбулось — це зафіксовано в T-4598, а не «полагодимо»
- [ ] **Cookie-банер vs GPC-положення юриста**: GPC зобов'язує лише якщо це в політиці — Verify з T-4588 перед релизом
