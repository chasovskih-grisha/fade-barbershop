# T-4204f · Трейсинг: OTel у api + колектор і Tempo (obs)

- **Stage**: M5 (phase 30) · **Tags**: backend, devops, infra, observability · **Complexity**: middle · **Depends on**: T-4204b, T-4204e
- **StoryPoints**: 5

## What

Розподілене трасування api: OTel NodeSDK з auto-instrumentations (http/express/nestjs/ioredis) → OTLP/HTTP → OTel Collector (профіль `obs`) → Tempo; `traceId`/`spanId` у JSON-логи (кореляція лог ↔ трейс); Grafana datasource Tempo + promtail derived_fields.

## Why

Трейси — швидкий дебаг запиту крізь шари (контролер → use case → Prisma/Redis); `traceId` в логах зшиває лог і трейс в одну історію. До слайсу outbox-події були «видимі» лише метрикою лагу — споживаний ланцюг залишався невидимим.

## Sources

- observability.md (трейсинг: OTel, W3C, семплінг, service map); T-4204 Epic
- Патерн obs-профілю T-4204b/d/e (Prometheus/Grafana/Loki — infrastructure поруч)

## Реалізація (2026-09-28)

- **api**: `src/otel.ts` — найперший імпорт main.ts (SDK до http-модулів); OTel JS **v2** (`resourceFromAttributes`, процесори в конструкторі); `OTEL_EXPORTER_OTLP_ENDPOINT` (без нього SDK живий, нічого не експортує — локальний dev без obs); `OTEL_SDK_LOG_LEVEL=debug` — діагностика. Логер (контракт §2) розширено `traceId`/`spanId` активного спана (м'який require — без SDK полів нема).
- **infra**: `infra/otel-collector/otel.yml` (OTLP/HTTP 4318 → Tempo OTLP gRPC 4317 + stdout-дзеркало), `infra/tempo/tempo.yml` (single-binary, filesystem; **Tempo v3**: top-level `compactor`/`multitenancy_enabled` видалені — мінімальний конфіг, дефолт-retention 336h), compose-сервіси `otel-collector` (127.0.0.1:14318) і `tempo` (127.0.0.1:13200) у профілі `obs`, volume `tempo_data`; Grafana datasource `tempo-fade` з tracesToLogs → `loki-fade`; promtail `derived_fields` → «trace in Tempo».
- **Специ**: лог-контракт без спана (§2 стабільний), кореляція з реальним TracerProvider (traceId/spanId у рядку = spanContext; у jest ALS-менеджер реєструється явно — той самий, що sdk-node ставить у prod).

## Done

- [x] Трейси api → колектор → Tempo (живий прогін: трейс `GET /public/services/active` — 10 спанів: http root, nestjs-core контролер, express middleware)
- [x] `traceId`/`spanId` у JSON-логи; зв'язок лог ↔ трейс у Grafana (promtail derived_fields)
- [x] W3C TraceContext — дефолт пропагатора (готовий до mobile/web RUM-трейсів)
- [x] api 644/644, tsc чистий; Tempo ready 200, колектор приймає батчі

## Risks / відкриті питання

- Семплінг always_on у dev; прод-семплінг (head 10% / tail 100% помилок) — окреме рішення епіка T-4204.
- Tempo v3 dev-retention 336h; прод-retention — T-4204 outstanding.
- Отримувачі OTLP на 4318 слухає і Tempo напряму — колектор лишаю єдиним входом (api пише лише в нього).
