# T-081 · Client ↔ barber chat

- **Stage**: M2 (phase 7) · **Tags**: backend, integration · **Complexity**: senior · **Depends on**: T-080
- **StoryPoints**: 8

## What

The `messaging` context (specification queue): chat within the scope of a visit (entry from the visit card §4/§4.3), realtime, offline sending queue, push notifications for new messages, boundaries: a barber can see chats of their visits.

## Sources

- products.md §3 (chat), `client-screens.md` §6 (queue), `barber-screens.md` §6

## Done

- [x] Чат працює в межах візиту на сервері: агрегат `Conversation`, `GET/POST /messaging/visits/:visitId/messages`, доступ лише клієнту візиту та його барберу (решта — 403).
- [x] Офлайн-черга — ідемпотентний серверний бік: повтор із тим самим `clientMessageId` повертає те саме повідомлення (`duplicate: true`), не плодить рядок і не шле другий push.
- [x] Push нового повідомлення: подія `messaging.message.created` з outbox → `ChatPushNotification` на пристрої співрозмовника (укр. тексти, відписка поважається).
- [x] Екрани — окремі слайси: mobile (**T-081a**: чат візиту, офлайн-черга на пристрої, realtime-підписка) і web (**T-081b**: панель на картці візиту); у `apps/mobile`/`apps/web` їх не було, а backend-рядок не може торкатись цих шляхів (`reviewTask` відмовляє: `review touches apps/mobile/...`).

## Risks

- [ ] **Migrations**: schema changes break existing data — migration with a backfill plan
- [ ] **Domain events**: idempotent subscriptions (ADR 0009/0016 pattern)

## Re-verified at HEAD (2026-11-26)

Заглушку `it('should be defined')` замінено (`messaging.controller.spec.ts` тепер піднімає справжній
`MessagingModule` і ходить по HTTP: `GET /messaging` → `{status:'ok',context:'messaging'}`,
`/messaging/conversations` → 404). Це лише доводить, що контролер живий; самого чату немає: немає
агрегату `Conversation`, репозиторію, realtime-каналу, офлайн-черги й push-віток, а в web/mobile немає
жодного екрана чату (`ChatBubble` ніде не використовується). `claimBlock` відмовляє: залежність T-080 у
`review`. Рядок лишається `review` — закривати нема чого.

## Re-verified at d92ff74d

`apps/api/src/messaging/` has a controller, a service and a module, but its only test
(`messaging.controller.spec.ts:17`) is `it('should be defined')`. No realtime channel, no offline queue
and no push wiring exist, and the row depends on T-080 (`review`). Nothing here can be ticked.

## Реалізовано (2026-11-26)

- Агрегат: `apps/api/src/messaging/domain/conversation.ts` — учасники візиту, роль відправника,
  ліміт 2000 символів, `NotAVisitParticipant` / `InvalidMessageBody` / `VisitNotFound`.
- Use cases: `send-chat-message.use-case.ts` (ліниве створення розмови, ідемпотентний реплей,
  outbox-подія з `recipientId`), `list-chat-messages.use-case.ts` (історія лише для учасника).
- Персистенція: `ChatConversation` / `ChatMessage` у `schema.prisma` + міграція
  `20261229000000_add_chat` (унікальний `(conversationId, clientMessageId)`), адаптери
  `prisma-conversation.repository.ts`, `prisma-visit-participants.ts` (ACL до `Booking`),
  `prisma-messaging-outbox.ts`.
- HTTP: `MessagingController` під `ClientSessionGuard`, користувач лише з сесії; мапер помилок
  у `messaging-http.mapper.ts`.
- Push: `notifications/application/chat-push.ts` + маршрут у `outbox-routing.ts` (`POLL_TYPES`).
- Тести: `messaging.controller.spec.ts` (8 кейсів, справжній HTTP контролера: надсилання обома
  учасниками, реплей офлайн-черги, історія, 403/400/404/401) і `chat-push.spec.ts` (4 кейси).

## Implementation plan

Paths:
- apps/api/src/messaging/domain/conversation.ts
- apps/api/src/messaging/application/send-chat-message.use-case.ts
- apps/api/src/messaging/application/messaging.service.ts
- apps/api/src/messaging/infrastructure/messaging.controller.ts
- apps/api/src/messaging/infrastructure/messaging.controller.spec.ts
- apps/api/src/notifications/application/chat-push.ts
- apps/api/src/notifications/application/chat-push.spec.ts
- apps/api/prisma/schema.prisma

Checks:
- pnpm --filter @fade/api exec jest apps/api/src/messaging/infrastructure/messaging.controller.spec.ts --forceExit
- pnpm --filter @fade/api exec jest apps/api/src/notifications/application/chat-push.spec.ts --forceExit

## QA

- `pnpm --filter @fade/api exec jest apps/api/src/messaging/infrastructure/messaging.controller.spec.ts --forceExit` exit 0
- `pnpm --filter @fade/api exec jest apps/api/src/notifications/application/chat-push.spec.ts --forceExit` exit 0


- `pnpm --filter @fade/api exec jest apps/api/src/notifications/application/chat-push.spec.ts --forceExit` exit 0

## Другий цикл (2026-11-26): список розмов і добивка wiring

Перший qa-прохід залишив поза комітом два файли проводки (`notifications.providers.ts`,
`outbox-relay.fakes.ts`) — по одному рядку, які гейт не вважає «істотними» й тому не комітить,
тож `done` відмовив («done commit changes product files»). Проводку перенесено в `relayProviders`
(контекст релея сам реєструє споживача чату) і в хелпер `makeChatPushConsumer` у фейках; Замість тихого коміту після qa рядок відкрито знову і
додано те, чого бракувало mobile-входу в чат: `GET /messaging/conversations` — розмови
поточного користувача (клієнт або барбер), новіші зверху, ліміт 50
(`MessagingService.listMine`, `listForUser` у репозиторії) плюс кейс у
`messaging.controller.spec.ts`: свій список бачить лише учасник, сторонній — порожній.

## Implementation notes

- apps/api/src/messaging/application/messaging.service.ts
- apps/api/src/messaging/domain/ports.ts
- apps/api/src/messaging/infrastructure/messaging.controller.spec.ts
- apps/api/src/messaging/infrastructure/messaging.controller.ts
- apps/api/src/messaging/infrastructure/prisma-conversation.repository.ts
- apps/api/src/notifications/infrastructure/outbox-relay.fakes.ts
- apps/api/src/notifications/relay.providers.ts
