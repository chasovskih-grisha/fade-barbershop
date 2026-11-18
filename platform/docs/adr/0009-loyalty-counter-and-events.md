# ADR 0009. Loyalty: counter, reset and subscription to `AppointmentCompleted`

- Status: accepted
- Date: 2026-09-09 (updated 2026-09-11 — counter scope)

> **Update 2026-09-11**: counter scope fixed — count **all** completed visits, without service classification (one visit = one increment; decision in LYL-001). Handler `AppointmentCompleted` doesn't filter by service type; if ever need "only haircuts" — filter added to handler, mechanism unchanged.

## Context

Bonus "every 7th visit — free" (criteria `05-loyalty-free-visit.md`): counter counts **completed** visits; at 6/7 client granted right to free visit (`FreeVisit`); after free visit completion counter resets (7th, 14th, 21st…). Cancelled and no-show not counted; free visit cancellation right preserved (LYL-001, LYL-002, LYL-003, LYL-006).

Three questions to close:

1. **Where counter lives** — derived value from visit history or materialized state.
2. **Subscription reliability** — `scheduling` publishes `AppointmentCompleted` via outbox (at-least-once): redelivery shouldn't count visit twice.
3. **Right lifecycle** — how free visit reflected at booking (scheduling), in payment (billing) and when consumed/reset.

Alternatives:

1. **Calculate on the fly from visit history** at each read — slow, complicates admin corrections (`LoyaltyCounterAdjusted`), history grows.
2. **Event sourcing** for single counter — excessive for single rule.
3. **Materialized state + idempotent event processing** — simple, controllable, predictable.

## Decision

### 1. Counter — materialized state

- Aggregate **`ClientLoyaltyState`** (context `loyalty`, one per `ClientProfileId`): `counter` (0..6), `hasFreeVisit` (bool), plus processed events table (`processedAppointmentIds`) for idempotency.
- Counter — **state, not derived value**: not recalculated from visit history at read. Admin correction (`LoyaltyCounterAdjusted`) — direct state change with logging (LYL-ADM-03).
- Threshold **T = 7** lives in `LoyaltyRule` (configurable, LYL-ADM-01) and applied only to future increments — without history recalculation.

### 2. Free visit right lifecycle

- When `counter` reaches **T−1 = 6** (after completion of 6th counted visit) — right granted: `hasFreeVisit = true`, event **`FreeVisitGranted`** (→ `notifications`, push LYL-MOB-02).
- At booking `scheduling` **queries `loyalty`** (query via context public API) about active right: if exists — visit marked free, event **`FreeVisitApplied`** → `billing` calculates `FinalPrice = 0` (LYL-004, ADR 0007). If no right — regular booking.
- Right **consumed only by completion**: free visit cancellation and no-show **preserve** right and counter unchanged (LYL-006).

### 3. Subscription to `AppointmentCompleted` (idempotent)

- `scheduling` publishes `AppointmentCompleted` via **outbox**; `loyalty` subscribes by application-handler.
- Processing **idempotent by `AppointmentId`**: before increment checks `processedAppointmentIds`; redelivery ignored — no double counting.
- Single message processing — **one transaction**:
  - visit was free (had `FreeVisitApplied` marker) → **`FreeVisitUsed`**, `counter = 0` (reset);
  - otherwise → `counter += 1`; if reached 6 → `FreeVisitGranted`.

## Consequences

- Simplicity: no history recalculation; admin corrections direct and logged.
- Reliability: outbox + idempotency exclude event loss and double counting.
- "Every 7th" semantics exact: free visit **not in cycle** — after it count from zero (7th, 14th, 21st…).
- Cost: processed events table grows with visit count; if needed — archive by age.
- Test invariant: redelivery of `AppointmentCompleted` doesn't change `ClientLoyaltyState`.
