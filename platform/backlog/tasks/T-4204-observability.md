# T-4204 · Observability Stack

- **Stage**: M5 (phase 30) · **Tags**: backend, devops, infra, high-risk · **Complexity**: senior · **Depends on**: T-002, T-300, T-3804
- **StoryPoints**: 30 (sum of slices a–f; production channel, retention, RUM, and profiling without a separate slice yet)

## What
Full observability stack: OpenTelemetry (tracing), Prometheus (metrics), Grafana (dashboards & alerts), Loki (logs), Tempo (distributed traces). Error tracking (Sentry), uptime checks, SLO monitoring, alerting rules for API latency, error rates, queue backpressure, and database performance.

## Why
Without comprehensive observability, production incidents are detected by users rather than internal alerts. High-risk backend and infrastructure require proactive monitoring.

## Sources
- `platform/infra/README.md`
- ADR 0012 (Observability & Logging Standards)

## Done
- [ ] OpenTelemetry instrumentation across API, worker, and frontend
- [ ] Prometheus metrics collection and Grafana dashboards configured
- [ ] Loki log aggregation and Tempo distributed tracing integrated
- [ ] Alertmanager alerts configured for error rates, latency p99, and queue depth
- [ ] Sentry error tracking integrated in backend and frontend
- [ ] Load testing validation of telemetry overhead
