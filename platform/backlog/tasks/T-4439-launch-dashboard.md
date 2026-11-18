# T-4439 · Дашборд запуску / перші 7 днів

- **Stage**: M2 (phase 5) · **Tags**: backend, analytics · **Complexity**: middle · **Depends on**: T-303, T-4404, T-4204
- **StoryPoints**: 5

## What

Набір таблиць для перших 7 днів після public launch (CLT-01): локації онлайн, створені клієнти, дзвінки/записи, no-show, оплати і чек-інцепти, помилки ендпоінтів, métricas провайдера (SMS доставка, push доставка). Читається статусом «чи все витримало»; дані з щоденних журналів (T-4204) і CRM.

## Why

Перший тиждень — інкубатор проблем (недоставка SMS, потік чатів, розклади). Без дашборда reference «що поламалось у вівторок» неможливе.

## Sources

- observability.md; analytics README; roadmap чеклист (запуск); T-303

## Done

- [ ] 7 таблиць на сторінці «запуск», оновлюються щодня
- [ ] Гейт-пороги (>=95% доставки, <3% 5xx) видні
- [ ] Інструкція: як Create дашборд повністю з нуля (runbook)

## Implementation plan

Paths:
- apps/api/src/analytics/

Checks:
- `pnpm --filter @fade/api exec jest src/analytics`

## Implementation notes

- apps/api/src/analytics/application/get-launch-dashboard.spec.ts
- apps/api/src/analytics/application/get-launch-dashboard.ts
- apps/api/src/analytics/application/launch-dashboard.ports.ts
- apps/api/src/analytics/domain/launch-dashboard.spec.ts
- apps/api/src/analytics/domain/launch-dashboard.ts
- apps/api/src/analytics/infrastructure/admin-launch-dashboard.controller.ts
- apps/api/src/analytics/infrastructure/analytics.module.ts
- apps/api/src/analytics/infrastructure/prisma-launch-metrics.source.spec.ts
- apps/api/src/analytics/infrastructure/prisma-launch-metrics.source.ts

## Risks

- [ ] **Іллюзорная метрика**: чистота на API без доставки SMS — денний алерт (T-4204) спостерігає канали