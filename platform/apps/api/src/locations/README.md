# Мережа локацій (`locations`)

> Тип піддомену: **Supporting**

Точки мережі, крісла, графік роботи, призначення барберів на локацію.

## Ubiquitous language

- **Location** — точка мережі (CLT-01, CLT-02, …).
- **Chair** — крісло в локації (2 на точку).
- **StaffAssignment** — барбер закріплений за локацією.
- **OpeningHours** — години роботи локації.

## Aggregates (план, ще не код)

- `Location`

## Domain events (план)

- `LocationOpened`
- `ChairAdded`
- `StaffAssigned`
- `HoursChanged`

## Порти (план)

- `LocationRepository`

## Хто викликає

Admin (CRUD), web (публічний каталог точок), mobile (вибір салону).

## Шарність

- `domain/` — Чиста модель. Без Nest, Prisma, HTTP, Expo. Тут entities, value objects, events, repository-порти.
- `application/` — Use cases: command/query, handlers, політики доступу. Транзакція = один use case.
- `infrastructure/` — Адаптери цього контексту (Prisma, HTTP, черга). Зовнішні системи лише через ACL, не в domain.

Код домену не імпортує Nest, Prisma, React Native і HTTP-клієнти. Залежності спрямовані всередину: infrastructure → application → domain.

Публічний API контексту (коли з’явиться код) реекспортує domain + application, **не** infrastructure.
