# T-4204d · Grafana + First Dashboard (Slice T-4204)

- **Stage**: M5 (phase 30) · **Tags**: infra, devops · **Complexity**: middle · **Depends on**: T-4204b (scrape and metrics)
- **StoryPoints**: 5

## What
`grafana` service in compose (profile `obs`, port 19094) + provisioning from `infra/grafana/`: Prometheus datasource (uid `prometheus-fade`, url `http://prometheus:9090`), dashboards provider (updateIntervalSeconds 30 — hot reload of JSON), dashboard "Fade — Overview": outbox lag with threshold zones (50 / 60s — as warning /health), geocoder counters (increase over 5m), provider failures and rate-limit rejections stat panels, process (uptime, RSS). Admin password — `GRAFANA_PASSWORD` (dev default admin/admin).

## Why
Dashboard is human eyes over metrics: outbox lag is visible as a trend with a red threshold zone, not just in JSON probes and alerts. Provisioning files in repo — dashboards are reproducible, not manual.

## Sources
- docs/observability.md (T-4204)
- Google SRE Book (the four golden signals — beginning: RED panels)

## Criteria
- [x] Grafana is alive: health ok, datasource health OK ("Successfully queried the Prometheus API")
- [x] Dashboard provisioned in Fade folder (API search)
- [x] Zero provisioning errors in logs
