# T-4445 · Рекомендовані послуги на головній

- **Stage**: M2 (phase 5) · **Tags**: backend, marketing · **Complexity**: junior · **Depends on**: T-024, T-030
- **StoryPoints**: 3

## What

Блок «рекомендуємо» на головній веба і в кабінеті: набір послуг (контен-вибір) з правилом показу (топ-N за чисельністю записів попереднього тижня або ручним піком) — конфігурується в адмінці, кешується. Аналітика кліків блоку повертається для налаштування.

## Why

Розширення чека через підказки; на основі реальних даних запитів (T-061) — «записатись ще на гарбузня». Продукт-плейсхолдер для cross-sell.

## Sources

- catalog README; web-screens.md; T-030 (публічні + контент), T-024, метрики записів

## Implementation plan

Paths:
- apps/api/prisma/schema.prisma
- apps/api/prisma/migrations/20261127040000_add_recommended_services/migration.sql
- apps/api/src/catalog/domain/recommended-services.ts
- apps/api/src/catalog/application/recommended-ports.ts
- apps/api/src/catalog/application/recommended-services.service.ts
- apps/api/src/catalog/application/recommended-events.service.ts
- apps/api/src/catalog/application/recommended.fakes.ts
- apps/api/src/catalog/application/recommended-services.spec.ts
- apps/api/src/catalog/application/recommended-config.spec.ts
- apps/api/src/catalog/application/recommended-events.spec.ts
- apps/api/src/catalog/application/recommended-cache.spec.ts
- apps/api/src/catalog/infrastructure/prisma-recommended-config.repository.ts
- apps/api/src/catalog/infrastructure/prisma-recommended-catalog.ts
- apps/api/src/catalog/infrastructure/prisma-recommendation-metrics.repository.ts
- apps/api/src/catalog/infrastructure/recommended.providers.ts
- apps/api/src/catalog/infrastructure/recommended-services.exception-filter.ts
- apps/api/src/catalog/infrastructure/public-recommended-services.controller.ts
- apps/api/src/catalog/infrastructure/admin-recommended-services.controller.ts
- apps/api/src/catalog/infrastructure/services.module.ts
- apps/api/src/catalog/README.md

Checks:
- `npx jest --config apps/api/jest.config.js --runTestsByPath apps/api/src/catalog/application/recommended-services.spec.ts apps/api/src/catalog/application/recommended-config.spec.ts apps/api/src/catalog/application/recommended-events.spec.ts apps/api/src/catalog/application/recommended-cache.spec.ts`

## Done

- [x] Блок на головній/кабінеті з правилом (контент або топ-N)
- [x] Клік → флоу запису з попередньо вибраною послугою
- [x] Метрика показів/кліків блоку

## Risks

- [x] **Cross-sell повільного**: явного «додам до запису» без конфлікту слотів — у флоу крок 2 (T-041)

## Implementation notes

- apps/api/src/catalog/application/recommended-cache.spec.ts
- apps/api/src/catalog/application/recommended-services.service.ts

## QA

- `npx jest --config apps/api/jest.config.js --runTestsByPath apps/api/src/catalog/application/recommended-services.spec.ts apps/api/src/catalog/application/recommended-config.spec.ts apps/api/src/catalog/application/recommended-events.spec.ts apps/api/src/catalog/application/recommended-cache.spec.ts` exit 0
