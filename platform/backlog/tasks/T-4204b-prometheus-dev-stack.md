# T-4204b · Prometheus dev stack + outbox lag alerts (T-4204 slice)

- **Stage**: M5 (phase 30) · **Tags**: infra, devops · **Complexity**: middle · **Dependencies**: T-4204a (/metrics)
- **StoryPoints**: 5

## What

`infra/prometheus/` (prometheus.yml: scrape `api:13000` every 15s; alerts.yml: `OutboxRelayBacklog` pending > 50, `OutboxOldestPendingTooOld` oldest > 60s — thresholds identical to /health thresholds from outbox-health.contributor.ts). Service `prometheus` in docker-compose (profile `obs`, port 19090, volume `prometheus_data`).

## Why

Outbox lag — first metric on poor (T-042c/T-4204): lagging event relay visible before full stack. Rules verified on live dev stack; delivery (Alertmanager → Slack/PagerDuty) — separate prod deploy step.

## Requirement sources

- docs/observability.md (T-4204 starts from here)
- Google SRE Book (alerting on symptoms)

## Criteria

- [x] `docker compose --profile obs config` valid; prom/prometheus image
- [x] Live verification: target `up`, `fade_outbox_pending_messages=232`, both `pending` rules (health ok) on real backlog
- [x] README + observability.md updated
