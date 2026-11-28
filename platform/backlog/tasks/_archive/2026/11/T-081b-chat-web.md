# T-081b · Чат візиту на web-картці

- **Stage**: M2 (phase 7) · **Tags**: frontend · **Complexity**: middle · **Depends on**: T-081
- **StoryPoints**: 3

## What

Виділено з T-081: після серверного чату лишилась web-поверхня — панель чату на картці візиту в
кабінеті клієнта. Вхід — лише для клієнта візиту; історія тягнеться з
`GET /messaging/visits/:visitId/messages`, надсилання — `POST` із тим самим `clientMessageId`.

## Sources

- `client-screens.md` §6, `design-system.md` (компонент `ChatBubble`)
- `apps/api/src/messaging/infrastructure/messaging.controller.ts`

## Done

- [x] Панель чату на картці візиту: історія, поле вводу, відправлення
- [x] Помилки 403/404 показуються як «чат недоступний», а не як зламана сторінка

Панель згорнута до відкриття (історія не тягнеться даремно) і вбудована в `AppointmentCard` як
`VisitChatPanel visitId={app.id}`; бульбашки — `ChatBubble` з `@fade/ui`, автор — за `senderRole`.
Надсилання йде з `clientMessageId`, тож реплей тієї самої спроби не плодить дубль.

## Implementation plan

Paths:
- apps/web/src/app/account/visits/VisitChatPanel.tsx
- apps/web/src/app/account/visits/visitChatApi.ts
- apps/web/src/app/account/visits/__tests__/visit-chat-panel.test.tsx

Checks:
- pnpm --filter @fade/web exec jest apps/web/src/app/account/visits/__tests__/visit-chat-panel.test.tsx

## Risks

- [ ] **Чужі візити**: панель не має показувати чат візиту, який не належить користувачу — сервер віддає 403, UI не має його ігнорувати.

## Implementation notes

- apps/web/src/app/account/visits/VisitChatPanel.tsx
- apps/web/src/app/account/visits/__tests__/visit-chat-panel.test.tsx
- apps/web/src/app/account/visits/visitChatApi.ts

## QA

- `pnpm --filter @fade/web exec jest apps/web/src/app/account/visits/__tests__/visit-chat-panel.test.tsx` exit 0
