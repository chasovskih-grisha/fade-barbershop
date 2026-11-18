# T-4204a · /metrics — експозиція Prometheus (Slice T-4204)

- **Stage**: M5 (phase 30) · **Tags**: backend, infra · **Complexity**: middle · **Depends on**: T-042c (outbox-проба /health)
- **StoryPoints**: 5

## What
`GET /metrics` (text/plain; version=0.0.4): процесні метрики (uptime, версія Node, RSS), лічильники геокодера (ті самі, що /health) і датчики лагу outbox (`fade_outbox_pending_messages`, `fade_outbox_oldest_pending_seconds` — з OutboxLagProbe через ModuleRef, як у /health). MetricsModule імпортує HealthModule — GeocoderMetrics спільний інстанс з /health. У мінімальній збірці outbox-рядки відсутні.

## Why
Промішеус-формат — інтеграційна точка для всього observability-стеку T-4204 (дашборди, алерти). Лічильники in-process агрегуються Prometheus по інстансах сам.

## Sources
- docs/observability.md (база: /health, лічильники геокодера)
- geocoder-metrics.ts (коментар про Prometheus-агрегацію — T-4204)

## Критерії
- [x] 7 юніт-спеків (формат, Content-Type, спільний інстанс, outbox null-деградація)
- [x] Живий контейнер: `fade_nodejs_version_info{version="v20.20.2"} 1`, outbox-датчики = /health warning
- [x] tsc + lint + повний прогон з --coverage EXIT=0
