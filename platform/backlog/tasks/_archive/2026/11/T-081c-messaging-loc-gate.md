# T-081c · Файли чату в межах LOC-гейта

- **Stage**: M2 · **Tags**: backend · **Complexity**: middle · **Depends on**: T-081

## What

Хвіст T-081: `eslint` падав з `max-lines` на файлах чату — `prisma-conversation.repository.ts`
(рядкові мапери + запити в одному файлі) і `messaging.controller.spec.ts` (223 рядки).
Продакшн-код і спека лишаються ті самі, розділені за гейтом; поведінка не змінюється.

## Done

- [x] Рядкові мапери Prisma → `prisma-conversation-rows.ts`; репозиторій лише читає/пише.
- [x] Спека контролера розділена: спільна збірка застосунку в `messaging-test-app.ts`, сценарії надсилання/історії та список/відмови — окремі файли.

## Implementation plan

Paths:
- apps/api/src/messaging/infrastructure/prisma-conversation-rows.ts
- apps/api/src/messaging/infrastructure/prisma-conversation.repository.ts
- apps/api/src/messaging/infrastructure/messaging-test-app.ts
- apps/api/src/messaging/infrastructure/messaging.controller.spec.ts
- apps/api/src/messaging/infrastructure/messaging-guards.spec.ts

Checks:
- pnpm --filter @fade/api exec jest apps/api/src/messaging/infrastructure/messaging.controller.spec.ts apps/api/src/messaging/infrastructure/messaging-guards.spec.ts --forceExit

## QA

- `pnpm --filter @fade/api exec jest apps/api/src/messaging/infrastructure/messaging.controller.spec.ts apps/api/src/messaging/infrastructure/messaging-guards.spec.ts --forceExit` exit 0



## Implementation notes

- apps/api/src/messaging/infrastructure/messaging-guards.spec.ts
- apps/api/src/messaging/infrastructure/messaging-test-app.ts
- apps/api/src/messaging/infrastructure/prisma-conversation-rows.ts
