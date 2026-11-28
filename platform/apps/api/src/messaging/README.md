# Листування (`messaging`)

> Тип піддомену: **Core**

Чат клієнт ↔ барбер навколо візиту. Не загальний месенджер і не коментарі блогу.

## Ubiquitous language

- **Conversation** — діалог, прив’язаний до клієнта, барбера і (опційно) запису.
- **Message** — одне повідомлення (текст, фото, системне).

## Aggregates

- `Conversation`

## Domain events

- `ConversationStarted`
- `MessageSent`
- `ConversationClosed`

## Порти

- `ConversationRepository`
- `RealtimePublisher`

## Позначки доставки й прочитання (T-4432)

- `ChatMessage.deliveredAt` ставиться, коли отримувач дістає історію
  (`GET /messaging/visits/:visitId/messages`) або читає розмову.
- `ChatMessage.readAt` ставиться явним `POST /messaging/visits/:visitId/read`;
  прочитане завжди доставлене — read закриває доставку тим самим часом.
- Бейдж: `GET /messaging/conversations` віддає `unreadCount` (вхідні без
  `readAt`), історія — `unreadCount` розмови. Один запит на список розмов.
- Push на нове повідомлення йде з outbox (`messaging.message.created`), а
  швидке листування не дублюється: реплей із тим самим `clientMessageId` не
  створює другий рядок і не шле другий push.

## Хто викликає

Лише mobile (клієнт і барбер). Admin — read-only аудит за потреби.

## Шарність

- `domain/` — Чиста модель. Без Nest, Prisma, HTTP, Expo. Тут entities, value objects, events, repository-порти.
- `application/` — Use cases: command/query, handlers, політики доступу. Транзакція = один use case.
- `infrastructure/` — Адаптери цього контексту (Prisma, HTTP, черга). Зовнішні системи лише через ACL, не в domain.

Код домену не імпортує Nest, Prisma, React Native і HTTP-клієнти. Залежності спрямовані всередину: infrastructure → application → domain.

Публічний API контексту (коли з’явиться код) реекспортує domain + application, **не** infrastructure.
