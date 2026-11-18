# T-4499 · Payments Export for Accounting

- **Stage**: M6 (phase 40) · **Tags**: backend, finance · **Complexity**: junior · **Depends on**: T-4404, T-092
- **StoryPoints**: 5

## What

Stable financial data export for accountant/1C: payment log (T-4404) in CSV (period, masked client, service, amount, channel, payment type, transaction id), scheduled summary amounts for reconciliation, control sum. Format is fixed (semantic), period correctness, no personal data beyond necessary.

## Why

Accountant without technical access needs export of all movements; reconciliation with bank and provider (T-092) is impossible without export.

## Sources

- payroll.md; billing README; T-4404 (log), T-092 (payments)

## Done

- [ ] CSV export (period, masks, sources) fixed and stable
- [ ] Period checksum reconciled with log (test)
- [ ] Access restricted to finance_role (T-2400 permissions)

## Risks

- [ ] **Storage fields**: "non-pharma" call — client name masked (only id + amount) in options
