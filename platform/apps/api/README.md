# @fade/api — модульний моноліт

HTTP + WebSocket API для web, admin і mobile. Каркас зібрано (T-001): NestJS, усі bounded contexts, health-ендпоінт. Бізнес-логіка додається за фазами.

## Призначення

Єдина система правди: ідентичність, локації, каталог, записи, CRM, чат, контент, оплати, сповіщення.

## Структура

Див. `src/README.md` і `src/<context>/README.md`.

Шари: `domain` → `application` → `infrastructure`. Prisma, Nest і клієнти Checkbox — лише infrastructure (`main.ts` — composition root).

Не генерувати мікросервіси Nest. Один додаток.

## Запуск

З кореня платформи:

```bash
pnpm --filter @fade/api dev    # Nest у watch-режимі (webpack), порт 13000
```

`dev` збирає через webpack: Nest-збірка з `composite` + `deleteOutDir` пропускає emit при warm `tsconfig.tsbuildinfo`, і `node dist/main` падає з «Cannot find module».

## Локальні залежності

```bash
docker compose -f infra/docker-compose.yml --env-file infra/.env.docker --profile deps up -d
```

Postgres `:15432`, Redis `:16379`, MinIO `:19000`/`:19001` (бакети створює `minio-init`). Порти нестандартні й прив’язані до `127.0.0.1`, щоб не конфліктувати з іншими проєктами. Повна картина: `infra/README.md`, ADR 0018.
