# T-081d · Чат: стрім нових повідомлень (SSE) для клієнтів

- **Stage**: M2 (phase 7) · **Tags**: backend, messaging, realtime · **Complexity**: middle · **Depends on**: T-081
- **StoryPoints**: 3

## What

Виділено з T-081a: mobile-екран чату (T-081a) показує історію та відправляє через офлайн-чергу, але
оновлюється лише після власного надсилання. Підписки на нові повідомлення немає ніде: на API існує
тільки адмінський SSE (`apps/api/src/realtime/admin-live.controller.ts`, `@Sse('events')`), у
`apps/web` і `apps/mobile` немає жодного `EventSource`/`WebSocket` і немає залежностей
`eventsource`/`react-native-sse`/`socket.io`.

Ця задача додає стрім чату на API і контракт, який клієнти зможуть слухати; після неї mobile-екран
перемикається з перезавантаження після надсилання на підписку.

## Sources

- `apps/api/src/messaging/infrastructure/messaging.controller.ts`
- `apps/api/src/realtime/admin-live.controller.ts` (зразок SSE-транспорту)
- `docs/acceptance-criteria` (чат), `client-screens.md` §6

## Done

- [ ] `GET /messaging/visits/:visitId/stream` віддає нові повідомлення візиту через `@Sse`, з тією ж авторизацією, що й історія (чужий візит — 403 до відкриття потоку)
- [ ] Контракт події зафіксований типом (id, senderRole, body, createdAt) і покритий тестом на реальному контролері
- [ ] Відписка закриває потік, коли клієнт відпадає; реплей після розриву не дублює повідомлення (`clientMessageId`)

## Implementation plan

Paths:
- apps/api/src/messaging/infrastructure/messaging.controller.ts
- apps/api/src/messaging/infrastructure/messaging-stream.controller.spec.ts

Checks:
- pnpm --filter @fade/api exec jest apps/api/src/messaging/infrastructure/messaging-stream.controller.spec.ts

## Risks

- [ ] **Дублі з push (T-4432)**: стрім і push можуть доставити те саме повідомлення — дедуп за `id`/`clientMessageId` на клієнті.

## Current slice (2026-11-27)

- `ChatStream` (`apps/api/src/messaging/application/chat-stream.ts`) — шина в памʼяті процесу, ключ — id розмови; відписка прибирає порожню кімнату (`openRooms` — для тестів).
- `ChatAnnouncer` (`chat-announcer.ts`) — одна відповідальність «нове повідомлення»: outbox-подія для push-релея + публікація в стрім. Винесено, щоб `SendChatMessage` лишився в межах max-params 3 (ADR 0019).
- `MessagingStreamController` — `@Sse('visits/:visitId/stream')` з `ClientSessionGuard`; учасника перевіряє `ListChatMessages` **до** відкриття потоку, тож чужий візит — 403, а не порожній стрім. Окремий контролер: `messaging.controller.ts` уже на межі LOC-гейта.
- Контракт події — `ChatStreamEvent` (`messaging.dto.ts`): `id`, `senderRole`, `body`, `createdAt`, `clientMessageId`; імʼя SSE-події `message`.
- Реплей офлайн-черги не дублює стрім: повтор із тим самим `clientMessageId` повертає `duplicate` і не публікує другу подію.
- Покриття: `messaging-stream.controller.spec.ts` (4) — доставка іншому учаснику, 403 до відкриття потоку, реплей, закриття кімнати після відписки. `jest src/messaging` 13/13; ESLint зачеплених файлів — 0 errors.
