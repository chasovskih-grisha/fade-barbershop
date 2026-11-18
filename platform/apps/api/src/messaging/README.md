# Листування (`messaging`)

> Тип піддомену: **Core**

Чат клієнт ↔ барбер навколо візиту. Не загальний месенджер і не коментарі блогу.

## Ubiquitous language

- **Conversation** — діалог, прив’язаний до клієнта, барбера і (опційно) запису.
- **Message** — одне повідомлення (текст, фото, системне).

## Aggregates (план, ще не код)

- `Conversation`

## Domain events (план)

- `ConversationStarted`
- `MessageSent`
- `ConversationClosed`

## Порти (план)

- `ConversationRepository`
- `RealtimePublisher`

## Хто викликає

Лише mobile (клієнт і барбер). Admin — read-only аудит за потреби.

## Шарність

- `domain/` — Чиста модель. Без Nest, Prisma, HTTP, Expo. Тут entities, value objects, events, repository-порти.
- `application/` — Use cases: command/query, handlers, політики доступу. Транзакція = один use case.
- `infrastructure/` — Адаптери цього контексту (Prisma, HTTP, черга). Зовнішні системи лише через ACL, не в domain.

Код домену не імпортує Nest, Prisma, React Native і HTTP-клієнти. Залежності спрямовані всередину: infrastructure → application → domain.

Публічний API контексту (коли з’явиться код) реекспортує domain + application, **не** infrastructure.
