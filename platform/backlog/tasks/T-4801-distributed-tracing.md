# T-4801 · Distributed Tracing & OpenTelemetry Integration

- **Stage**: M4 (or M0/Observability) · **Tags**: backend, infra, observability · **Complexity**: senior · **Depends on**: T-001, T-002
- **StoryPoints**: 8

## What

Implement end-to-end distributed tracing using OpenTelemetry (OTel) across all NestJS micro-services (`apps/api`), Next.js frontends (`apps/web`, `apps/admin`), and background workers, integrated with the existing Prometheus, Tempo, and Grafana observability stack (`platform/infra/`).

- Configure `@opentelemetry/sdk-node` and auto-instrumentation for HTTP, Prisma, Redis, and gRPC/TCP in NestJS.
- Propagating W3C Trace Context headers (`traceparent`, `tracestate`) across HTTP calls and Redis pub/sub / outbox message queues.
- Next.js instrumentation (`instrumentation.ts`) for frontend request tracing.
- Centralized log correlation injecting `trace_id` and `span_id` into Winston logger formatters.

## Why

As the platform scales to multiple locations and high booking concurrency, debugging latency bottlenecks across API gateways, scheduling engines, and database transactions requires unified request tracing and telemetry correlation.

## Sources

- `platform/docs/observability.md`
- `platform/infra/docker-compose.yml`, `platform/infra/tempo/`
- `platform/docs/architecture.md`

## Implementation plan

Checks:
- `node scripts/check-otel-wiring.mjs`
- `node --test scripts/check-otel-wiring.test.mjs`
- `node scripts/validate-docs.mjs`

## Done

- [x] OpenTelemetry SDK initialized in NestJS API bootstrap (`apps/api/src/main.ts`) — `import './otel'` first, T-4204f
- [x] W3C Trace Context propagation verified across API requests and outbox event publishing — `shared/tracing/outbox-trace.ts`, T-4204f
- [ ] Next.js frontend tracing configured and reporting to OpenTelemetry Collector — `apps/web/instrumentation.ts` does not exist; still open
- [x] Grafana Tempo data source dashboards displaying end-to-end request traces with log correlation — `infra/grafana/provisioning/datasources/tempo.yml` (tracesToLogs → `loki-fade`)
- [x] CI pipeline health check verifying OTel collector export endpoints — `scripts/check-otel-wiring.mjs`, `pnpm otel:check`/`otel:test` in `.github/workflows/ci.yml`

> State 2026-11-19: 4 of 5 criteria closed. The wiring gate catches four silent
> breakages that otherwise show up only in Grafana: `./otel` is not the first
> import, `OTEL_EXPORTER_OTLP_ENDPOINT` port ≠ collector OTLP receiver,
> collector without an `otlp/tempo` exporter, datasource port ≠ Tempo's
> internal port.

## Risks

- [ ] **Performance overhead**: Tracing payload size and CPU overhead under high request throughput.
- [ ] **Context loss**: Dropping trace context across asynchronous outbox event handlers.
