# T-4207 · Фреймворк idempotency keys

- **Stage**: M5 (phase 30) · **Tags**: backend, high-risk, integration · **Complexity**: middle · **Depends on**: T-041, T-090, T-091
- **StoryPoints**: 12

## What
Фреймворк idempotency keys: клієнт генерує `Idempotency-Key` (UUID v4), сервер валідує (формат, унікальність, TTL 24 год), зберігає результат (статус, тіло відповіді, заголовки), повертає кешовану відповідь на повтор, автоматична очистка (TTL), middleware для всіх mutating-ендпоінтів (POST/PUT/PATCH/DELETE), інтеграція з платежами (Stripe idempotency), букінгом, webhooks.

## Why
Мережеві помилки/ретраї не повинні створювати дубльовані записи/платежі. Стандарт Stripe/API best practice.

## Sources
- Stripe Idempotency Keys pattern
- Stripe Idempotency Keys pattern
- ADR 0009/0016 (ідемпотентні підписники — патерн outbox)

## dependencies
> Слайси виділяються при старті задачі; окремі файли підзадач створюються тоді ж за потреби.

## Implementation plan

Paths:
- apps/api/src/shared/idempotency/
- apps/api/prisma/

Checks:
- `pnpm --filter @fade/api exec jest src/shared/idempotency`

## Implementation notes

- apps/api/prisma/migrations/20261214000000_add_idempotency_record/migration.sql
- apps/api/prisma/schema.prisma
- apps/api/src/app.module.ts
- apps/api/src/shared/idempotency/idempotency.interceptor.spec.ts
- apps/api/src/shared/idempotency/idempotency.interceptor.ts
- apps/api/src/shared/idempotency/idempotency.module.ts
- apps/api/src/shared/idempotency/idempotency.spec.ts
- apps/api/src/shared/idempotency/idempotency.store.ts
- apps/api/src/shared/idempotency/idempotency.ts
- apps/api/src/shared/idempotency/prisma-idempotency.store.ts

