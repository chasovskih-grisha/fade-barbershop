# T-6011a · Правила алертів Prometheus для api, web, admin

- **Stage**: horizontal · **Tags**: devops, infra · **Complexity**: middle · **Depends on**: T-6011
- **StoryPoints**: 3

## What

Правила алертів у `infra/prometheus/alerts.yml` для трьох застосунків (5xx, недоступність,
латентність) з перевіркою `infra/prometheus/check-alerts.sh`, що валить складання на синтаксично
некоректному правилі або алерті без `for`/`severity`.

## Why

T-300 закривав «алерти працюють» без конфігурації в репозиторії, тому його план не міг назвати
перевірку (дефект T-6011). Файл правил плюс валідатор — це код, який seat `devops` володіє (`infra/`).

## Sources

- T-300; T-6011; `docs/observability.md`
- `infra/prometheus`, `infra/alertmanager`

## Done

- [ ] Правила для api, web, admin з `for` і `severity`
- [ ] `check-alerts.sh` валить складання на битому YAML і на алерті без `for`
- [ ] Прогін валідатора в документі

## Out of scope

- Секрет-стор і бекапи прод (T-300)

## Current slice (2026-11-27)

- `infra/prometheus/alerts.yml` має нову групу `apps`: `AppTargetDown` (`up{job=~"fade-(api|web|admin)"} == 0`, 2m, critical), `ApiHigh5xxRate` (>5% `code="5xx"` за 5m, 10m, critical) і `WebPoorLcpShare` (>25% семплів `LCP` у `poor` за 30m, warning). Метрики взяті з наявної експозиції (`fade_http_requests_total{route,code}`, `fade_web_vitals_samples_total{metric,rating}`) — гістограми латентності в api немає, тому «латентність api» покрита SLO-групою (`BookingLatencyBurnRate*`).
- `infra/prometheus/check-alerts.sh` — валідатор: парсить YAML пакетом `yaml` із pnpm-сховища (без нової залежності), валить на табах, на невалідному YAML, на відсутньому `groups:` і на алерті без `expr`/`for`/`severity`. Перевірено на трьох зламаних входах (алерт без `for`, таби, незакритий `[`) — усі exit 1; на справжньому файлі — `OK (9 alerts)`.
- Прогін задокументовано в `docs/observability.md` (розділ про алерти).
- **Відкрито до `done`:** у `prometheus.yml` є лише scrape-job `fade-api`; `up{job="fade-web"}`/`fade-admin` поки не існує, тож ці два алерти оживуть лише з появою job-ів (окремий devops-крок). Валідатор не ввімкнений у CI — підключити до workflow поруч з іншими `scripts/check-*`.
