# T-4208 · Saga Pattern / Distributed Transactions

- **Stage**: M5 (phase 30) · **Tags**: backend, high-risk, architecture · **Complexity**: senior · **Depends on**: T-042, T-090, T-4200
- **StoryPoints**: 20

## What
Saga orchestrator for distributed transactions: appointment creation → payment authorization → notification → loyalty update. Choreography (via events) vs Orchestration (central coordinator). Compensating transactions (cancel appointment → refund payment → cancel notification → rollback loyalty). State machine (pending → running → completed/compensating → failed). Persistence (event store), idempotency, timeout handling, manual intervention queue.

## Why
Appointment + payment + notification must be atomic. Partial failure = inconsistency. Saga = eventual consistency with guarantees.

## Sources
- ADR 0049 (sagas; proposed)
- Temporal.io / Eventuate Tram / Seata pattern
- ADR 0009/0016 (events + compensations — outbox pattern)

## dependencies
> Slices are allocated at task start; individual subtask files are created then if needed.
