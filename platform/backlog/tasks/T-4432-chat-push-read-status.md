# T-4432 · Chat: new message push + "read" status

- **Stage**: M2 (phase 5) · **Tags**: backend, messaging · **Complexity**: middle · **Depends on**: T-081, T-080
- **StoryPoints**: 5

## What

Chat (T-081) receives realtime delivery: "new message" push via prime channels (T-4431/T-080), message-level `delivered`/`read` statuses, read synchronization on read models for the unread badge; for the barber — a separate counter in the app.

## Why

Chat without push lives only in the app; the client expects to reply quickly — without a call center, this is a push focus (the client will be disappointed by the wait).

## Sources

- messaging README; client-screens.md; barber-screens.md; T-081

## Done

- [x] Push channel for new chat messages (with routing to dialog)
- [x] Delivered/read statuses are read in both apps; counter badge is synchronized
- [x] Push deduplication during rapid messaging

## Risks

- [ ] **Edition dedup**: realtime + push duplicate delivery — formula "push only for inactive screens" in test
## Implementation plan

Paths:
- apps/api/prisma/schema.prisma
- apps/api/prisma/migrations/20261127020000_add_chat_message_receipts/migration.sql
- apps/api/src/messaging/domain/conversation.ts
- apps/api/src/messaging/domain/ports.ts
- apps/api/src/messaging/application/mark-conversation-read.use-case.ts
- apps/api/src/messaging/application/list-chat-messages.use-case.ts
- apps/api/src/messaging/application/messaging.service.ts
- apps/api/src/messaging/infrastructure/prisma-chat-receipts.ts
- apps/api/src/messaging/infrastructure/prisma-conversation.repository.ts
- apps/api/src/messaging/infrastructure/prisma-conversation-rows.ts
- apps/api/src/messaging/infrastructure/messaging-receipt.controller.ts
- apps/api/src/messaging/infrastructure/messaging.controller.ts
- apps/api/src/messaging/infrastructure/messaging.dto.ts
- apps/api/src/messaging/infrastructure/messaging-test-repo.ts
- apps/api/src/messaging/infrastructure/messaging-test-app.ts
- apps/api/src/messaging/messaging.module.ts
- apps/api/src/messaging/infrastructure/messaging-read-receipts.spec.ts
- apps/api/src/messaging/README.md

Checks:
- `npx jest --config apps/api/jest.config.js --runTestsByPath apps/api/src/messaging/infrastructure/messaging-read-receipts.spec.ts apps/api/src/messaging/infrastructure/messaging.controller.spec.ts`

## Implementation notes

- apps/api/src/messaging/application/messaging.service.ts
- apps/api/src/messaging/infrastructure/messaging-read-receipts.spec.ts
- apps/api/src/messaging/infrastructure/messaging-receipt.controller.ts
- apps/api/src/messaging/infrastructure/messaging-test-repo.ts
- apps/api/src/messaging/infrastructure/prisma-chat-receipts.ts

## QA

- `npx jest --config apps/api/jest.config.js --runTestsByPath apps/api/src/messaging/infrastructure/messaging-read-receipts.spec.ts apps/api/src/messaging/infrastructure/messaging.controller.spec.ts` exit 0
