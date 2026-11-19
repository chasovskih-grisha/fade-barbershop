# T-4461 · Збережені CRM-фільтри

- **Stage**: M4 (phase 8) · **Tags**: backend, frontend, crm · **Complexity**: junior · **Depends on**: T-060, T-4424
- **StoryPoints**: 3
- **Статус**: review

## What

Список клієнтів CRM розширюється зберіганням фільтрів: набір (стать, локація, останній візит, мітки T-4424, діапазон дат) зберігається як сесійний прев'ю-фільтр, потім «зберегти як» для повторного використання; швидкий доступ з дашборду; виконування кожні N — на T-4461але. Фільтр не створює нову сутність сегмента — лише збережений запит.

## Why

Оператор щодня повторює «ті, хто не був 60 днів, локація А»; збережені фільтри — найшвидший робочий інструмент.

## Sources

- crm README; admin-screens.md §6; T-060, T-4424

## Done

- [x] CRUD збережених фільтрів; повторне виконання однією клікою
- [x] Фільтри містять момент-читання (без живих даних у прев'ю)
- [x] Юніт-тест на коректність запитів

## Реалізація

- `crm/domain/saved-client-filter.ts` — чиста політика: `normalizeSavedFilterQuery`
  (канонічний запит через `parseClientListQuery`, `page` у фільтр не
  зберігається), `savedFilterLabel` (український підпис), `toListParams`,
  `createSavedFilter`/`renameSavedFilter`/`updateSavedFilterQuery`,
  `assertFilterCanBeSaved` (дубль назви й квота `MAX_SAVED_FILTERS_PER_OWNER = 20`),
  `isOwnedBy`, `filterListItems` (новіші спершу).
- `crm/application/saved-client-filter.service.ts` — `SavedClientFilterService` +
  порт `SavedClientFilterRepository` з in-memory реалізацією: `create`, `list`,
  `get`, `rename`, `updateQuery`, `remove`, `run` (свіже читання через наявну
  `AdminClientList`, повертає `readAt`).
- `crm/infrastructure/admin-client-filters.controller.ts` — `GET/POST
  /admin/client-filters`, `GET/PATCH/DELETE /admin/client-filters/:id`,
  `PATCH :id/query`, `POST :id/run`; окремий контролер, щоб `GET :clientId`
  не перехоплював `/filters`.
- `crm/application/crm-errors.ts` + `crm.exception-filter.ts` —
  `SavedFilterNotFoundError` → 404 (чужий фільтр теж 404), `SavedFilterConflictError`
  → 409.
- `crm/crm.module.ts` — контролер, сервіс і провайдер порту.
- `crm/application/saved-client-filter.spec.ts` — 10 тестів (політика, сервіс,
  HTTP-контролер).

## Нотатки

- Зберігаються **лише** параметри, які реально вміє `GET /admin/clients`:
  `search`, `locationId`, `loyaltyStatus`, `sort`, `order`, `perPage`, `period`.
  Стать, мітки T-4424 і довільний діапазон дат у списку ще не підтримуються —
  вони додаються разом зі своїми задачами (T-4424/T-4545), без паралельного
  контракту.
- `ownerId` передається явно, як `changedBy` у сусідніх ендпоінтах crm:
  сесійна авторизація адмінки — T-4486/T-4566.
- **Відкладено**: UI списку/швидкого доступу з дашборду (frontend-частина
  картки), Prisma-таблиця збережених фільтрів (порт готовий), автозапуск
  «кожні N» — окрема T-4461а.

## Risks

- [x] **Дрейф даних**: збережений фільтр показує змінені мітки/статус — перерахунок на читання (T-061)
  — зберігається тільки запит, дані читаються щоразу свіжими (`run` → `readAt`)
