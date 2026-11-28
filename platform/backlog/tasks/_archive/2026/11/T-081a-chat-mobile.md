# T-081a · Чат візиту в mobile

- **Stage**: M2 (phase 7) · **Tags**: mobile · **Complexity**: senior · **Depends on**: T-081
- **StoryPoints**: 5

## What

Виділено з T-081: серверний чат візиту вже є (`/messaging/visits/:id/messages`), лишились поверхні
mobile — екран чату з картки візиту («Мої візити» і картка барбера), офлайн-черга на пристрої з
ідемпотентним `clientMessageId` і підписка на нові повідомлення замість полінгу.

## Sources

- `client-screens.md` §6 (queue), `barber-screens.md` §6
- `apps/api/src/messaging/infrastructure/messaging.controller.ts`

## Done

- [x] Екран чату візиту в mobile: історія, відправлення, стан «черга» для не відправлених
- [x] Офлайн-черга: повідомлення зберігається локально, реплей із тим самим `clientMessageId` не дублюється
- [ ] Нові повідомлення приходять підпискою (realtime), а не полінгом

Пункт 3 винесено в **T-081d**: станом на цей коміт стріму чату не існує ні на API, ні в клієнтах —
`apps/api/src/realtime/admin-live.controller.ts` (`@Sse('events')`) є єдиним SSE, у `apps/web` і
`apps/mobile` немає жодного `EventSource`/`WebSocket`, і в `package.json` mobile/web/кореня немає
`eventsource`, `react-native-sse` чи `socket.io`. Екран оновлюється після власного надсилання
(`reload()` після `flushQueue`), а не полінгом за таймером; підписка з'явиться поверх T-081d.

## Implementation plan

Paths:
- apps/mobile/src/screens/chat/VisitChatScreen.tsx
- apps/mobile/src/chat/offline-queue.ts
- apps/mobile/src/chat/visit-chat-api.ts
- apps/mobile/src/app/(client)/appointment/[id]/chat.tsx
- apps/mobile/src/chat/__tests__/offline-queue.test.ts
- apps/mobile/src/screens/chat/__tests__/visit-chat-screen.test.tsx

Checks:
- pnpm --filter @fade/mobile exec jest apps/mobile/src/chat/__tests__/offline-queue.test.ts
- pnpm --filter @fade/mobile exec jest apps/mobile/src/screens/chat/__tests__/visit-chat-screen.test.tsx

## Risks

- [ ] **Подвійна доставка**: реплей черги після відновлення мережі не має плодити дублі — ключ `clientMessageId` генерується один раз на повідомлення.

## Implementation notes

- apps/mobile/src/app/(client)/appointment/[id]/chat.tsx
- apps/mobile/src/chat/__tests__/offline-queue.test.ts
- apps/mobile/src/chat/offline-queue.ts
- apps/mobile/src/chat/visit-chat-api.ts
- apps/mobile/src/screens/chat/VisitChatScreen.tsx
- apps/mobile/src/screens/chat/__tests__/visit-chat-screen.test.tsx

## QA

- `pnpm --filter @fade/mobile exec jest apps/mobile/src/chat/__tests__/offline-queue.test.ts` exit 0
- `pnpm --filter @fade/mobile exec jest apps/mobile/src/screens/chat/__tests__/visit-chat-screen.test.tsx` exit 0
