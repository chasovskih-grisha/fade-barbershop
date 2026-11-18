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
