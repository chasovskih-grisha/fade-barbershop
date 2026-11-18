# T-4434 · Electronic Receipts (email/SMS/cabinet)

- **Stage**: M2 (phase 5) · **Tags**: backend, finance, integration · **Complexity**: middle · **Depends on**: T-092, T-093
- **StoryPoints**: 5

## What

Upon successful payment/service provision, the client receives an electronic receipt (fiscal or receipt per T-093 type): via email channel (T-4408 dev / T-4202 prod), SMS (T-080), or client cabinet. Format and content are verified against T-4404 (payment ledger for accounting) so that one payment = one receipt.

## Why

A receipt is a legal and anticipated part of payment; without it, clients demand paper receipts, and accounting (payroll.md) cannot confirm revenue operations.

## Sources

- billing README; T-092/T-093 (payment/receipt type responsibility); payroll.md (receipt for accounting)

## Done

- [ ] Receipt generation upon payment/service; delivery via selected channel
- [ ] Repeat receipt request from cabinet (no spamming — "channel duplicate" does not send twice)
- [ ] One payment → one receipt (invariant in test with T-4404)

## Risks

- [ ] **Fiscalization**: FOP CLT-01 without fiscalization — receipt-voucher, not cash register; type flag in T-093
