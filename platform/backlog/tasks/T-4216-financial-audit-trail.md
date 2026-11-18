# T-4216 · Financial audit trail

- **Stage**: M6 (phase 40) · **Tags**: backend, finance, legal, high-risk · **Complexity**: senior · **Depends on**: T-090, T-3604
- **StoryPoints**: 18

## What

Immutable financial ledger: **Double-entry** — every transaction = debit + credit (entries, payments, refunds, tips, payouts, fees, adjustments); **Immutable store** — append-only (event store / Kafka / PostgreSQL with insert-only triggers), cryptographic chain (hash chain / Merkle tree), WORM compliance; **Reconciliation** — daily reconciliation (bank statement ↔ ledger ↔ payment gateway), discrepancy queue, auto-resolution rules; **Reporting** — trial balance, P&L, balance sheet, cash flow, tax reports; **Audit** — read-only external auditor access, evidence packages, tamper-proof logs.

## Why

Financial transparency. Auditor requirements. Fraud protection. Compliance.

## Sources

- docs/financial-audit-trail.md — phantom 2026-09-22: file never existed; source accepted at task start
- IFRS / GAAP / National Accounting Regulations (Standards) of Ukraine
- Event sourcing / Kafka / Immutable DB

## dependencies
> Slices are created upon task start; individual subtask files are created then if needed.
