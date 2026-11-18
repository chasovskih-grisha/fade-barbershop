# T-4802 · Redis Distributed Lock & Slot Race-Condition Resilience

- **Stage**: M1 (Scheduling core) · **Tags**: backend, scheduling, high-risk · **Complexity**: senior · **Depends on**: T-040
- **StoryPoints**: 8

## What

Harden the availability booking engine against race conditions and double-booking under extreme concurrency using Redlock / Redis distributed locking combined with PostgreSQL Serializable isolation levels for the 2-chair invariant (`T-040c`).

- Implement distributed mutex locking per barber and time slot using `ioredis` and Redlock algorithm.
- Add atomic slot reservation token generation with configurable TTL (e.g., 60-second reservation lock during checkout).
- Graceful failure handling and retry backoff for concurrent booking attempts on identical slots.

## Why

Simultaneous booking attempts by multiple users for the exact same barber and time slot can cause race conditions violating the 2-chair concurrency invariant and double-booking chairs.

## Sources

- `platform/docs/architecture.md`, `platform/backlog/tasks/T-040-availability-slots.md`
- `platform/docs/composed-service-slot-optimization.md`

## Done

- [ ] Distributed lock service implemented with Redis and Redlock protocol
- [ ] Slot reservation token TTL enforcement during booking checkout flow
- [ ] Concurrency stress tests simulating 50 simultaneous booking requests for the same slot passing with exactly 1 success and 49 clean lock-contention rejections
- [ ] Audit logging for lock acquisition timeouts and release failures

## Risks

- [ ] **Deadlocks**: Improper lock release on unexpected worker crashes (mitigated by strict TTL expiration).
- [ ] **Redis partition**: Handling split-brain or Redis master failover without violating slot invariants.

## Implementation plan

Paths:
- apps/api/src/scheduling/
- apps/api/src/scheduling/README.md

Checks:
- `pnpm --filter @fade/api exec jest src/scheduling/application/slot-reservations src/scheduling/domain/slot-reservation src/scheduling/infrastructure/redis-slot-lock`

## Implementation notes

- apps/api/src/scheduling/application/slot-lock.ports.ts
- apps/api/src/scheduling/application/slot-reservations.service.spec.ts
- apps/api/src/scheduling/application/slot-reservations.service.ts
- apps/api/src/scheduling/domain/slot-reservation.spec.ts
- apps/api/src/scheduling/domain/slot-reservation.ts
- apps/api/src/scheduling/infrastructure/client-bookings.controller.ts
- apps/api/src/scheduling/infrastructure/in-memory-slot-lock.ts
- apps/api/src/scheduling/infrastructure/redis-slot-lock.spec.ts
- apps/api/src/scheduling/infrastructure/redis-slot-lock.ts
- apps/api/src/scheduling/infrastructure/slot-lock.audit.logger.ts
- apps/api/src/scheduling/infrastructure/slot-lock.providers.ts
- apps/api/src/scheduling/infrastructure/slot-reservations.controller.ts
- apps/api/src/scheduling/scheduling.module.ts

