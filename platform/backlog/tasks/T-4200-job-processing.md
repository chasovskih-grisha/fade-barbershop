# T-4200 · Background Jobs (job processing)

- **Stage**: M5 (phase 30) · **Tags**: backend, infra, high-risk · **Complexity**: senior · **Depends on**: T-002, T-3100, T-3803
- **StoryPoints**: 25

## What
Queue system: BullMQ (Redis) / Temporal.io for asynchronous operations. Task types: notifications (email/SMS/push), analytics aggregation, delayed publishing (blog), Webhook delivery, cleanup (old carts, tokens). Retries with backoff, Dead Letter Queue (DLQ), dashboard/metrics in Prometheus/Grafana, graceful shutdown, idempotency keys for tasks.

## Why
Asynchronous operations are scattered or missing. Without a robust job queue, delayed publishing, reliable notifications, and webhook delivery will fail under load.

## Sources
- ADR 0026 (Job Processing Architecture)
- `apps/api/src/jobs/README.md`
- `platform/infra/docker-compose.yml` (Redis)

## Done
- [ ] Queue infrastructure (BullMQ/Temporal) configured and running in docker-compose
- [ ] Base job processor and producer abstractions implemented
- [ ] Critical tasks ported to queue: notifications, webhooks, analytics
- [ ] DLQ and retry policies configured with exponential backoff
- [ ] Metrics exported to Prometheus; Grafana dashboard created
- [ ] Integration tests for queue failure and recovery scenarios

## Risks
- [ ] **Job duplication**: network glitch causes duplicate execution — strict idempotency keys required across all jobs.
