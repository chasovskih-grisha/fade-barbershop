# T-4619 · An unpaid deposit frees the chair

- **Stage**: M2 (phase 8) · **Tags**: backend, billing, scheduling · **Complexity**: senior · **Depends on**: T-091, T-040
- **StoryPoints**: 13

## What

A visit that is waiting for its deposit holds a chair only for a short window. If the money is not captured, the chair goes back on sale. The visit is not a no-show and not a completed cancellation with a fee.

T-091 covers taking the 30% deposit, idempotent capture, and the error branches where the client can retry. It does not say what happens to the chair when the client closes the page. With two chairs, an abandoned checkout is half the room.

Rules:

- Creating the visit starts a `DepositHold` of 15 minutes.
- Captured payment confirms the visit and ends the hold. Until then the visit stays unconfirmed (PAY-WEB-02).
- A refusal inside the window leaves the same visit unpaid and retryable (PAY-WEB-05). The chair stays held until the window ends or the money is captured.
- At expiry with no capture, the visit becomes `deposit_expired`. The chair is free. No receipt. No no-show mark. No automatic debt.
- A second click and a late webhook must not capture money onto an already expired visit, and must not create a second visit (PAY-WEB-03, PAY-006).
- After expiry the client starts again through the normal booking flow. That is a new hold, not a resurrection of the expired one.

## Why

The slot was never paid for. Leaving it blocked punishes the next guest. Charging a no-show fee for a checkout they abandoned is a different policy and is not this task.

## Sources

- T-091 (capture and retry)
- `docs/acceptance-criteria/01-billing-payments.md` (PAY-WEB-02, PAY-WEB-03, PAY-WEB-05, PAY-006, PAY-003)
- ADR 0048 (expiry is an in-process tick; this epic does not choose BullMQ or Temporal)
- T-040 (chair invariant)

## Done

- [x] Slices a and b are `done`
- [x] An unpaid visit older than 15 minutes is not occupying a chair
- [x] A captured payment still confirms the visit

## Risks

- [x] **Late success.** A webhook that arrives after expiry must not mark the visit confirmed. If money actually moved, the refund path T-091 and T-094 already own applies. This epic does not invent a new refund provider — закрито `SettleWebhookCapture` (пізній capture → `expired` + `refundLateCapture`) і нагадуванням `deposit_hold.expiring` за 5 хвилин до дедлайну
- [ ] **Walk-in.** Walk-in has no deposit (T-120). It never enters this hold

## Out of scope

- The acquiring integration itself — **T-091**
- No-show, which keeps a captured deposit (PAY-WEB-07). Expiry is not a no-show
- The waitlist offer hold — ADR 0012. Same length, different object. Do not reuse that timer
