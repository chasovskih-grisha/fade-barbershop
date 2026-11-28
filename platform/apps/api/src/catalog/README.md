# Каталог послуг (`catalog`)

> Тип піддомену: **Supporting**

Послуги, тривалість, прайс. Ціна може відрізнятися по локаціях.

Контент до коду: каталог `business/operations/catalog.md` + `catalog.csv`; ціни — `locations/{CODE}/business/financials/pricing.csv`. Адмінка не вигадує SKU — сіє з цього реєстру.

Код сьогодні лежить у сусідньому `services/`, а `booking/data/services.json` годує запис окремим меню. Це закриває **T-4615**: один модуль `catalog`, запис читає його. Зміна ціни і попередження адміна лишаються за T-024.

## Ubiquitous language

- **Service** — стрижка, гоління, комбо тощо. Мережевий каталог, без ціни.
- **Price** — ціна послуги в конкретній локації (UAH).
- **Duration** — тривалість слота (з каталогу, не з матриці цін). Для `father-son` залежить від `FulfillmentMode` (ADR 0011): sequential 90 хв, parallel 50 хв.

## Дані й API

- `Service` зберігає мережеві поля: назву, опис, категорію, активність, тривалість та необов’язкову `parallelDuration`.
- `ServicePrice` зберігає суму UAH та `active` для пари service/location. Неактивна ціна виключає послугу з вибору в цій локації; вимкнений `Service` виключає її всюди.
- Адмінка: `GET/POST /admin/services`, `PATCH /admin/services/:id`, `PATCH /admin/services/:serviceId/prices/:locationId`.
- Бронювання читає `GET /booking/services/:locationId`; слот приймає `fulfillmentMode` (`sequential` або `parallel`) і вибирає відповідну тривалість.
- `Booking.agreedPrice` та `Booking.fulfillmentMode` — snapshot під час створення. Редагування матриці впливає на наступні бронювання.
- Міграція переносить стару спільну ціну на кожну вже створену локацію. Старі бронювання лишають snapshot порожнім, бо достовірного узгодженого прайсу в них не було.

## Aggregates

- `Service`

## Domain events

- Події `ServicePublished` і `PriceChanged` заплановані; індекс задач відстежує їх окремо.

## Порти (план)

- `ServiceRepository`

## Хто викликає

Web (меню), mobile (запис), admin (редагування).

## Шарність

- `domain/` — Чиста модель. Без Nest, Prisma, HTTP, Expo. Тут entities, value objects, events, repository-порти.
- `application/` — Use cases: command/query, handlers, політики доступу. Транзакція = один use case.
- `infrastructure/` — Адаптери цього контексту (Prisma, HTTP, черга). Зовнішні системи лише через ACL, не в domain.

Код домену не імпортує Nest, Prisma, React Native і HTTP-клієнти. Залежності спрямовані всередину: infrastructure → application → domain.

Паралельне бронювання батька й сина на двох барберах потребує `AppointmentParty` за ADR 0011; тут зберігається SKU та його тривалості, а не дві ноги візиту.

## Рекомендовані послуги (T-4445)

Блок «рекомендуємо» для головної веба й кабінету. Спершу береться конфіг
локації, якщо його немає — мережевий дефолт (`locationId = NULL`), інакше
вбудоване правило (`top-week`, 4 позиції). `RecommendedServicesConfig`:

- `mode: manual` — ручний вибір у заданому порядку (те, що адмін обрав);
- `mode: top-week` — топ за кількістю записів за останні 7 днів (фільтр за
  локацією, сортування за спаданням, нічия — за id, щоб відповідь була
  стабільною);
- без конфігу й без попиту — холодний старт у порядку каталогу
  (`source: "fallback"`).

Ліміт 1…8 (дефолт 4); дублі відкидаються; послуга, якої немає в локації
(вимкнена або без активної ціни), не показується навіть якщо вона в конфігу.
Блок кешується в процесі на 60 с (`RECOMMENDED_CACHE_TTL_SECONDS`), збереження
конфігу скидає ключ своєї локації; зміна мережевого дефолту скидає кеш усіх
локацій, бо він діє на кожну локацію без власного конфігу.

- `GET /public/recommended-services?locationId=…` — `{locationId, mode,
  source, services: [{id, name, duration, category, priceUah}], cachedUntil}`.
- `POST /public/recommended-services/events` — `{serviceId, kind}` де `kind` —
  `impression` або `click`; пише добовий лічильник (`RecommendedServiceMetric`,
  доба в UTC) і повертає `{serviceId, kind, day}`.
- `GET /admin/recommended-services?locationId=…` — поточний конфіг або `null`.
- `PUT /admin/recommended-services` — `{locationId?, mode, serviceIds?, limit?}`;
  невідома послуга → 404, поганий ліміт/режим → 400.
- `POST /admin/recommended-services/invalidate?locationId=…` — скинути кеш
  локації (без параметра — усіх), щоб головна побачила зміну цін одразу.
- `GET /admin/recommended-services/metrics?from&to` — `[{serviceId, kind, count}]`
  за період (дефолт — останні 7 днів).

Клік веде у звичайний флоу запису з попередньо вибраною послугою — блок лише
віддає `serviceId`, екран запису вже вміє прийняти послугу параметром.
