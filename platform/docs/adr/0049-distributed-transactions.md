# ADR 0049: Distributed transactions — saga orchestration vs event choreography

## Status
**Proposed** — decision at start of T-4208. Originally task quoted phantom "ADR 0045" from backlog expansion 2026-09-22; real number — 0049. Until accepted source of truth: events from outbox + idempotent handlers (ADR 0009/0016) and `docs/engineering-principles.md`.

## Context

Chain "record → payment authorization → notification → loyalty" (T-042, T-090/T-091, T-080, T-140) not atomic at DB level: it crosses external integrations (payment gateway) and time boundaries. Today this is **choreography**: `AppointmentCompleted` from outbox, idempotent subscribers (capture deposit, notifications, loyalty, feedback window); compensations — domain events refund (T-094). Question: when partial failure complexity grows (T-275 store payment, T-3900 recurring records), is central orchestrator needed?

- **Option A — choreography (events only)**: current state; simplest, no coordinator state. Limits: entire flow not visible from one place, compensation logic scattered across handlers.
- **Option B — orchestration (central saga state machine)**: explicit compensations and flow visibility; kept within context boundaries (billing/scheduling). Limits: new stateful component, risk of re-centralizing what outbox decentralized.
- **Option C — Temporal workflows**: durable execution, strongest guarantees; pair to Option C ADR 0048. Limits: same operational cost.

Constraints: ADR 0002 (monolith), engineering-principles (KISS/YAGNI; "unknown external call result — state, not exception").

## Decision
None yet — **proposed**. Recommendation: stay with choreography (A) until specific flow shows unmanageable compensations; decision fixed at start of T-4208.

## Consequences
- T-4208 scope depends on decision; manual intervention queue moves with choice.
- Payment idempotency (T-091, T-4207) doesn't depend on choice — needed in any case.

## References
- T-4208; adjacent: T-042, T-090/T-091/T-094, T-275
- ADR 0009/0016 (outbox), ADR 0002 (monolith)
- `docs/engineering-principles.md`
