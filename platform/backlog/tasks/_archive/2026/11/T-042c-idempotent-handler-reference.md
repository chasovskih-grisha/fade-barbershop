# T-042c · Idempotent reference handler (3/10)

- **Stage**: M1 (phase 4) · **Tags**: backend, high-risk · **Complexity**: senior · **Depends on**: T-042b
- **StoryPoints**: 3

## What

Single outbox event subscriber with processed events log (ADR 0009 pattern): redelivery does not duplicate effects. Pattern copied by loyalty (T-140), reviews (T-150), waitlist (T-170), analytics (T-110).

## Why

Slice 3/3 of parent T-042 — template for ~6 future subscribers; an error here replicates across the entire system.

## Sources

- ADR 0009 (idempotent subscription pattern)
- T-042 risk «relay without lag monitoring»

## Done

- [x] Handler with processed log; redelivery does not duplicate effects (Tests)
- [x] Artificial red delivery (simulated failure + retry) passes
- [x] Relay lag monitoring (outbox lag metric)
- [x] Pattern documented as reference for T-140/T-150/T-170/T-110

## Risks

- [x] **Template thinking**: subscribers copy pattern without understanding — review of first two copies by this task

## dependencies

- T-110 (first mass consumer of the pattern)

## Current slice (2026-09-25)

Reference — `infrastructure/appointment-activity.projection.ts`: `AppointmentActivityProjection` claims event via upsert into `AppointmentActivity` log (`eventId` UNIQUE) and applies effect **in a single relay transaction** — redelivery returns `duplicate` without effects, failure rolls back log along with effect. Artificial red delivery covered by test (apply failure → rollback → retry applies as first). `OutboxLagProbe.lag()` → `{pending, oldestPendingMs}` — relay lag metric; **connected to `/health` 2026-09-26** (outbox section with warning thresholds pending>50 / oldest>60s; section degradation to null in minimal build; T-4204 will connect Alertmanager alerts). Pattern documented in `apps/api/src/scheduling/README.md` (T-042c) — copied by T-140/T-150/T-170/T-110. Tests: `appointment-activity.projection.spec.ts` (unit, transactional semantics), `outbox-health.contributor.spec.ts` (thresholds and degradation) — postponed full Postgres e2e to the first consumer of the pattern (T-110) — see log.
