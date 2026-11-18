# T-5001 · Distributed Slot Locking Engine & Two-Chair Invariant Enforcement

- **Stage**: M4 (phase 13) · **Tags**: backend, architecture, high-risk · **Complexity**: senior · **Depends on**: T-040, T-040c
- **StoryPoints**: 13

## What

- Implement a robust distributed locking mechanism using Redis Redlock and PostgreSQL advisory locks for simultaneous slot booking requests during peak load (e.g., Friday evenings).
- Enforce the strict "two-chair invariant" (maximum concurrent active haircut operations per barber/chair) at the database transaction isolation level (Serializable / Repeatable Read with row-level locking).
- Add automated rollback and compensation mechanisms when slot lock acquisition fails due to race conditions.
- Provide comprehensive benchmark and stress-testing scripts (`benchmark-scheduling.ts` extension) simulating 1,000 concurrent booking requests for the same slot.

## Why

Peak load traffic in barbershops causes sudden flash-crowds where multiple clients attempt to book the exact same slot simultaneously. Without atomic distributed locking, double-booking and two-chair invariant violations occur, leading to operational friction and manual reconciliation.

## Sources

- `docs/architecture.md`, `docs/composed-service-slot-optimization.md`, ADR 0009, `platform/scripts/benchmark-scheduling.ts`

## Status

**Todo**

## Done

- [x] Redis Redlock client integration configured with proper lease timeouts and jitter
- [x] PostgreSQL advisory lock fallback and transaction serialization wrapper implemented
- [x] Two-chair invariant validation rules enforced in domain service layer
- [x] High-concurrency benchmark test suite verifying zero double-bookings under 1,000 RPS
- [x] Automated regression tests added to CI pipeline
