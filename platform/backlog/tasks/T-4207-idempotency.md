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
- apps/api/prisma/migrations/20261225000000_add_idempotency_response_headers/migration.sql

## Integration

- `IdempotencyInterceptor` зареєстрований глобально в `app.module.ts` для POST/PUT/PATCH/DELETE; ключ опційний, але валідується як UUID v4, коли присутній.
- `IdempotencyGuard` захищає `POST /scheduling/waitlist/:waitlistId/deposit`; платіжний контролер проходить через глобальний interceptor.
- Refund-запити до Stripe отримують стабільний `idempotencyKey`, тож повторний refund не створює другу операцію.
- Повтор повертає збережені status, body і response headers (без hop-by-hop/content-length), плюс `idempotency-replayed: true`.

## Verification

- `cd apps/api && npx jest <all 22 committed payment/idempotency/billing specs> --runInBand` — 22 suites / 109 tests passed.
- `cd apps/api && npx tsc --noEmit` — exit 0.
- Scoped eslint over the changed API files — exit 0.
- `cd apps/api && npx prisma validate` — schema valid.
- `cd apps/web && npx tsc --noEmit` — exit 0 after removing the dead `waitlist-analytics` route.

