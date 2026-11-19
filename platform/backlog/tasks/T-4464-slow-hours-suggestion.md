# T-4464 · Слабкі години: операторська підказка

- **Stage**: M4 (phase 8) · **Tags**: backend, analytics, crm · **Complexity**: middle · **Depends on**: T-111, T-152
- **StoryPoints**: 5
- **Статус**: review

## What

Аналітика для оператора: вільні слоти по днях/годинах за 2 тижні (з T-061), виявлення «слабких вікон» (заповненість < X%), пропозиція дії (промо-кампанія T-152, зсув графіка T-4415, нагадування «день ще вільний» клієнтам T-080). Алерт «слабка година — чому не кампанія?».

## Why

Замовник не бачить заповненість, поки не поламав графік; analytics (T-111) вже є — треба робоча підказка, а не звіт PDF.

## Sources

- analytics README; admin-screens.md §8; T-111 (вітрина аналітики), T-152 (кампании)

## Done

- [x] Аналітика вільних годин/днів з порогом заповненості
- [x] Підказка дії (промо/змах графіка/сповіщення) з прев'ю
- [x] Оновлення даних не блокують календар (read-модель)

## Реалізація

- `analytics/domain/slow-hours.ts` — чиста read-модель: `occupancyCells`
  (заповненість по днях/годинах у Europe/Kyiv, крісла й години роботи — конфіг),
  `weakWindows` (нижче `thresholdPercent`, минулі години, найгірші спершу),
  `suggestAction` (0 записів → зсув графіка; нижче порогу → промо),
  `weekdayOccupancy` (агрегат по днях тижня), `slowHourAlerts`
  («Слабка година: чт, 10:00 — 0% заповнення. Чому не промо-кампанія?»),
  `slowHoursReport`, `validateSlowHoursParams`.
- `analytics/application/get-slow-hours.ts` — `GetSlowHours` + порти
  `SlowHoursSource` і `SlowHoursClock` (час інжектується, звіт детермінований);
  `parseSlowHoursQuery`: `days` 1..60, `thresholdPercent` 1..100, `chairs` 1..50,
  `openHour`/`closeHour`, `locationId`; помилки → `InvalidSlowHoursQueryError`.
- `analytics/infrastructure/prisma-slow-hours.source.ts` — факти з `Booking`
  у вікні (скасування не займають крісло, no-show займає).
- `analytics/infrastructure/admin-slow-hours.controller.ts` — `GET
  /admin/analytics/slow-hours` → `{generatedAt, locationId, report}`; 400 на
  некоректні параметри.
- `analytics/infrastructure/analytics.module.ts` — контролер, джерело, годинник
  і `GetSlowHours` зареєстровані й експортовані.
- `analytics/application/slow-hours.spec.ts` — 13 тестів (домен, use case, HTTP).

## Нотатки / відкладено

- **Поріг і години — конфіг, не hardcode** (ризик «помилкова ціль»): сезонність
  без ML не вгадується, оператор крутить `thresholdPercent`/`openHour`/`closeHour`
  у запиті. Збереження цих налаштувань в адмінці — T-4450-стиль конфігурації.
- **Кількість крісел** зараз параметр `chairs` (дефолт 2): реальна кількість
  ресурсів прийде з T-4562 (resources), тоді знаменник читатиметься з локації.
- **Виконання дії** (запуск промо T-152, зсув графіка T-4415, розсилка T-080)
  не входить у слайс: тут підказка з прев'ю й причина, а не створення кампанії.
- **UI-картка на дашборді** адмінки (§8) — frontend-частина; API вже віддає
  клітинки, слабкі вікна, агрегат і алерти.
- Майбутні години й поточна незакінчена година у підказки не потрапляють.

## Risks

- [x] **Помилкова ціль**: заповненість без ML не враховує сезонність — поріг конфігурується, не hardcode
  — `thresholdPercent` (1..100), `days` (1..60) і години роботи приходять
  параметрами запиту; `hasEnoughData` позначає тонкі дані (< 3 днів)
