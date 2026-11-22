# T-4619a · Deposit hold and release

- **Stage**: M2 (phase 8) · **Tags**: backend, billing, scheduling · **Complexity**: senior · **Depends on**: T-091, T-040
- **StoryPoints**: 8

## What

Implement the hold in the domain.

- `DepositHold` is created in the same transaction as the visit that is waiting for payment. It stores `expiresAt` (15 minutes from creation) and is not a separate product.
- A short in-process tick expires due holds. One visit per transaction. Running it twice does not double-cancel. This is not a new job engine (ADR 0048).
- Expiry sets the reason `deposit_expired`, emits one outbox event, and removes the visit from availability. It does not call the no-show command.
- Capture before `expiresAt` confirms the visit and closes the hold.
- Capture after expiry does not confirm the visit. The use case returns a domain error the payment slice can refund or ignore without attaching the money to a free slot.
- Public slot queries ignore visits whose hold has expired even if the sweeper has not run yet. The chair is free on read, not only after the job.

## Why

The invariant has to hold when the process restarts and when the client asks for slots a second before the job runs.

## Sources

- T-4619
- ADR 0048
- PAY-WEB-03, PAY-006
- T-091, T-040

## Done

- [x] A visit waiting for payment blocks the chair
- [x] After 15 minutes without capture, slot search no longer returns that interval as taken
- [x] A second expiry pass changes nothing
- [x] Capture before expiry confirms; capture after expiry does not
- [x] Tests cover the race between a late webhook and the sweeper

## Progress

- 2026-11-22 — payment wiring closed: `DepositFlow` receives `DepositHoldService`,
  checks the hold before charging and closes it only after a successful capture
  (a declined charge keeps the same window retryable). Expiry now runs a durable
  sink that cancels the visit with `deposit_expired` and appends one outbox
  event (`scheduling.appointment.cancelled`); the conditional update makes the
  effect idempotent. Tests cover decline/retry and the sweeper-vs-late-capture race.

## Risks

- [ ] **Clock.** Use the application clock, not the database default, so tests can move time
- [ ] **Complimentary visit.** `FinalPrice = 0` has no hold (PAY-003). Do not expire it

## Out of scope

- The sentence on the payment screen — **T-4619b**
- Provider retries — **T-091**
