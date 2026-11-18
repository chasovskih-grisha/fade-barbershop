# T-094 · Refund: triggers, idempotency, expenditure receipt

- **Stage**: M2 (phase 8) · **Tags**: backend, high-risk · **Complexity**: senior · **Depends on**: T-091, T-092
- **StoryPoints**: 8

## What

PAY-005…010: triggers (cancellation ≥ 4 hrs — automatic; admin no-show removal — PAY-005b); command to acquiring immediately, retries → `refund_failed` + «Retry» (PAY-009); statuses `refunding → refunded`; expenditure receipt with `related_receipt_id` (PAY-010); cancel ↔ no-show race condition — first commit wins (PAY-008); visibility in «Payments» and passive client statuses (PAY-WEB-08, PAY-MOB-05).

## Sources

- `PAY-005…010`, `PAY-WEB-08`, `PAY-MOB-05`, `PAY-ADM-08`; NSH-ADM-03

## Done

- [ ] Timely cancellation auto-refund works with expenditure receipt
- [ ] Race condition and `refund_failed` covered by tests

## Risks

- [ ] **Migrations**: schema changes break existing data — migration with backfill plan
- [ ] **Domain events**: subscriptions are idempotent (pattern ADR 0009/0016)
