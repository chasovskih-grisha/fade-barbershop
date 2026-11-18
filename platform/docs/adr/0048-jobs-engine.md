# ADR 0048: Background task and schedule engine — outbox vs BullMQ vs Temporal

## Status
**Proposed** — decision at start of T-4200 (general engine) and T-4211 (schedule/cron). Originally these tasks quoted phantom "ADR 0042/0047" from backlog expansion 2026-09-22; real number — 0048. Until accepted source of truth: outbox pattern (ADR 0009/0016) and `docs/engineering-principles.md`.

## Context

Platform needs reliable async processing: notifications (T-080, T-3100), webhook delivery (T-3102), reports (T-3200), image processing, cleanup, reminders. Today this works via **outbox pattern** (ADR 0009/0016): publishers write events transactionally, handlers idempotent — pattern verified in `locations`, `scheduling`, `identity`. Question: when *general* engine needed (M5+, T-4200) — what to take?

- **Option A — outbox + PostgreSQL (pg_cron)**: nothing new beyond Postgres; handlers already idempotent. Limits: no queue priorities/rate limiting; schedule — pg_cron.
- **Option B — BullMQ (Redis)**: Redis already in stack (T-002); priorities, DLQ, repeatable jobs, UI. Limits: delivery semantics configured manually, Redis persistence — separate concern.
- **Option C — Temporal.io**: durable workflows, timers, saga-friendly (pair to ADR 0049). Limits: separate service in operations, learning curve, excessive at one location scale.

Constraints: ADR 0002 (modular monolith — no separate orchestration service without weighty reason), ADR 0018 (Docker dev — what's in prod must run in dev containers), engineering-principles (KISS/YAGNI — pattern appears when it hurts).

## Decision
None yet — **proposed**. Recommendation for discussion: start with **A** (outbox + pg_cron) for v1/M3–M4; move to BullMQ when queue features hurt (M5); Temporal — only if saga/durable workflows justify operational cost. Decision fixed at start of T-4200.

## Consequences
- T-4200/T-4211 form depends on decision; acceptance criteria (DLQ, retries, monitoring) move with engine.
- Consumers (notifications, webhooks, reports) stay on ports — engine changes without use case edits.
- Dev/prod parity (ADR 0018) mandatory for any option.

## References
- T-4200, T-4211; consumers: T-080, T-3100, T-3102, T-3200
- ADR 0009/0016 (outbox, idempotency), ADR 0002 (monolith), ADR 0018 (Docker dev)
- `docs/engineering-principles.md`
