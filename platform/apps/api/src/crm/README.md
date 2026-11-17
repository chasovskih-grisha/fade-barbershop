# Клієнтська база (`crm`)

> Тип піддомену: **Core**

Профіль гостя, історія візитів, вподобання, нотатки барбера. Не обліковий запис (це Identity).

**Win-back-кампанії** (WNB-*, фаза 18) — оркестрація над цим контекстом: сегменти рахуються за даними `crm` (`ClientProfile` + `Visit`; анонімні walk-in без профілю в сегменти не потрапляють — WNB-005), сам код створюється в `discounts`, доставка — `notifications`. Факт відправки кампанії клієнту (`CampaignSent`) живе тут — це історія комунікацій клієнта, на якій тримається анти-спам (не частіше ніж раз на 30 днів по сегменту, WNB-006) і ефективність в `analytics` (WNB-007). Механіка — `docs/campaigns.md`; критерії — `docs/acceptance-criteria/11-winback-campaigns.md`.

## Ubiquitous language

- **ClientProfile** — картка гостя.
- **Visit** — факт візиту (read-model з Scheduling).
- **Preference** — побажання (довжина, продукт, кава).
- **Note** — службова нотатка барбера.
- **InviteCode** — персональний реферальний код клієнта (генерується при створенні профілю); джерело посилання «приведи друга» (ADR 0014).
- **ReferredBy** — посилання на профіль запрошувача на профілі приведеного клієнта; фіксується при першій реєстрації (останній торк, вікно 30 днів), імутабельне (ADR 0014, RFR-004).
- **Campaign** — win-back-кампанія: сегмент + промокод (`discounts`) + текст push; факт відправки клієнту фіксується як `CampaignSent` (WNB-007).

## Aggregates (план, ще не код)

- `ClientProfile`

## Domain events (план)

- `ClientRegistered`
- `PreferenceUpdated`
- `NoteAdded`
- `CampaignSent` (факт відправки win-back-кампанії клієнту — основа анти-спаму WNB-006 і ROI в `analytics`, WNB-007)

## Порти (план)

- `ClientProfileRepository`

## Хто викликає

Mobile барбера, admin, частково клієнтський профіль у додатку.

## Read-модель списку клієнтів (T-4606a/b)

Адмінський список `GET /admin/clients` читає read-модель `AdminClientList` (`application/admin-client-list.ts`) через порт `ClientListReader` (`application/client-list-reader.ts`, DI-токен `CLIENT_LIST_READER`); Prisma-адаптер — `infrastructure/prisma-client-list.reader.ts`, e2e-фейк — `e2e/admin-clients.list-fakes.ts`. Валідація запиту — чиста функція `parseClientListQuery` (закриті набори, `perPage` 1..100, невідомі значення → 400), без class-validator — за патерном `AdminCalendar`.

**Рішення щодо підсумків (T-4606b): перерахунок із проєкцій, а не подієва агрегація.** Стрічка KPI рахується на кожен запит із тих самих таблиць (`ClientProfile` + `Visit`), з яких будується таблиця: фіксована кількість groupBy-запитів через `ClientListReader.summary()`, без N+1, без проміжної агрегованої таблиці й без подій outbox. Обґрунтування: обсяг бази — тисячі профілів, а підсумки потрібні **лише для фільтрованої множини поточного запиту** (`summary.total === total`, контракт T-4606) і для вікна `period` — збережена проєкція «клієнт × період» мусила б перераховуватися під кожен фільтр і кожне вікно. Межа перегляду — T-3201 (LTV/когорти/churn, M6): тоді аналітика отримує власну проєкцію з подій (ADR 0009), спискова стрічка лишається на перерахунку.

**Спільна проєкція з T-4528b**: картка клієнта (статистика) має читати той самий порт `ClientListReader.summary` — другий агрегат клієнтів заводити заборонено, інакше числа на списку й картці розійдуться.

## Read-модель історії візитів (T-061)

`Visit` — проєкція подій `scheduling` у факт історії клієнта (idempotent, патерн ADR 0009): домен `domain/visit.ts` (`applyVisitEvent` згортає подію у факт, guard за `occurredAt` не дає redelivery регресувати стан), порт `domain/visit.repository.ts`, застосунковий обробник `application/record-visit.use-case.ts` (ключ — `appointmentId`). Prisma-адаптер — `infrastructure/prisma-visit.repository.ts` (upsert за `appointmentId`); резолв клієнта за візитом — `infrastructure/prisma-visit-client.lookup.ts` (`Booking.clientId`; анонімний walk-in без профілю проєкцію не створює — WNB-005). Час слота в подіях scheduling — рядок `HH:mm`; дата візиту лишається на `Booking`. Наповнення — подіями (backfill історії — окремий крок).

## Шарність

- `domain/` — Чиста модель. Без Nest, Prisma, HTTP, Expo. Тут entities, value objects, events, repository-порти.
- `application/` — Use cases: command/query, handlers, політики доступу. Транзакція = один use case.
- `infrastructure/` — Адаптери цього контексту (Prisma, HTTP, черга). Зовнішні системи лише через ACL, не в domain.

Код домену не імпортує Nest, Prisma, React Native і HTTP-клієнти. Залежності спрямовані всередину: infrastructure → application → domain.

Публічний API контексту (коли з’явиться код) реекспортує domain + application, **не** infrastructure.
