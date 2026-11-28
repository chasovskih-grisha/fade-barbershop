# T-4594 · GA4 custom dimensions і custom metrics

- **Stage**: M3 (phase 3 — сайт, після першої пачки даних) · **Tags**: analytics, marketing, data-quality, frontend · **Complexity**: middle · **Depends on**: T-4593, T-4595
- **StoryPoints**: 5

## What

Реєстрація й супровід набору вимірювань, без яких GA4 не відповідає на маркетингові питання мережі: яка локація, який канал, який барбер, скільки грошей.

### Custom dimensions (обов'язкові)
| GA4 dimension | Параметр події | Коментар |
| --- | --- | --- |
| `location_code` | `location_code` | код локації (`dnipro` тощо), не адреса |
| `entry_point` | `entry_point` | `booking_cta` / `direct` / `qr` / `nav` |
| `user_role` | `user_role` | `client` / `barber` / `admin`, з `/profile` |
| `booking_channel` | `booking_channel` | `web` / `phone` (T-4536) |
| `booking_source` | `booking_source` | джерело запису (T-4536) |
| `is_any_barber` | `is_any_barber` | «Будь-який барбер» vs конкретний |
| `consent_state` | `consent_state` | контроль якості: частка подій без згоди = 0 |
| `environment` | `environment` | `staging` / `live`, фільтр технічного шуму |

### Built-in, які використовуються
`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `page_location`, `page_referrer`, `page_path`, `device_category`, `session_source`, `session_medium`.

### Умовні (Add, лише якщо є джерело)
- `service_category` — **тільки після** підтвердження, що категорія є в `ServiceDto` (`apps/web/src/app/booking/types.ts`); якщо її none в моделі каталогу — розширити DTO (T-032) або відмовитися від виміру до v1. Не вигадувати значення з `name`.
- `funnel_instance_id` — не custom dimension, а параметр події для дедуплікації в(funnel)-звіті; у GA4 його не реєструємо.

### Custom metric
- `booking_value` (uah, int) — сума записів за вибраними `booking_confirmed`; єдиний грошовий вимір для ROAS-звітів.

## Why

«Скільки записів і звідки» — GA4 вміє з коробки. «Яка локація, який канал, який барбер, скільки грошей» — ні: без custom dimensions звіт Says by conversion alone, і маркетинг працює навмання. Custom dimension, зареєстрована пізно, не має даних — тому реєстрація йде одразу після перших подій, а звіти — через добу.

## Sources

- T-4536 — атрибуція точки/каналу запису
- T-4576 — схема властивостей (джерело імен)
- T-4588 — мінімум PII
- `products.md` §1; T-4593 (властивість), T-4595 (контракт)

## Done

- [ ] Усі 8 обов'язкових dimensions зареєстровані з **точним** збігом імені з параметром події
- [ ] `booking_value` зареєстровано як metric (UAH)
- [ ] Кожна dimension має опис у адмінці GA4 (хто/що це таке) — інакше через рік ніхто не зрозуміє
- [ ] Ліміт 50 custom dimensions перевірено: використано ~8, запас є
- [ ] Усі dimensions наповнені даними (24–48 год після реєстрації) — перевірено в Explore, НЕ на очікуванні
- [ ] Умови: `service_category` або зареєстровано з реальним джерелом, або явно відсутній у v1 з причиною
- [ ] `entry_point` дозволяє відокремити записи з реклами/QR від прямих (`direct`)
- [ ] Звіт «Записи за локаціями» і «ROAS за каналами» звірено з внутрішнім дашбордом (T-4526b..T-4529b) — розбіжність записана, а не «потім подивимось»

## Risks

- [ ] **Затримка 24–48 год**: dimension, зареєстрована сьогодні, не працює в звіті сьогодні — реєструвати до планування кампаній
- [ ] **Невідповідність імен**: `locationCode` замість `location_code` → GA4 тихо пише `(not set)`. Правило: ім'я в GA4 = snake_case з контракту, без винятків
- [ ] **Зміна імен**: перейменування dimension в GA4 ламає всі історичні звіти — імена заморожуються з T-4576
- [ ] **`booking_value` ≠ виручка**: гроші записів ≠ гроші каси (скасування, переноси) — для фінансів є внутрішній дашборд, GA4 не є фінансовим джерелом
