# T-4404 · Financial Reconciliation and Payment Chain Resilience

- **Stage**: M3 (v1 launch gate) · **Tags**: backend, finance, integration · **Complexity**: high · **Depends on**: T-275, T-4434
- **StoryPoints**: 8

## What

Automated financial reconciliation between payment gateway provider statements (acquiring logs/API) and internal ledger (`payments`, `refunds`, `receipts`):

- Daily scheduled job (cron) pulling acquiring transactions and matching against DB ledgers by order reference and amount.
- Anomaly detection: missing webhooks, stuck capture/refunds, amount mismatches, unauthorized status overrides.
- Admin reconciliation interface (`/admin/finance/reconciliation`) with discrepancy list, manual match/ignore actions, and export to CSV/accounting formats.
- Audit trail for all manual reconciliation adjustments (MNG-ADM compliance).

## Why

Financial discrepancy between bank acquiring and system ledger is a critical operational risk at launch (M3 gate). Manual checks do not scale; automated reconciliation ensures 100% funds tracking and quick detection of stuck payouts or refunds.

## Sources

- payment-gateway spec; accounting requirements; T-3604 audit logging

## Done

- [ ] Automated daily reconciliation job matching acquiring exports with DB payment records
- [ ] Admin UI for reviewing and resolving discrepancies (match, ignore, flag)
- [ ] Audit log of all reconciliation actions and manual overrides
- [ ] E2E test simulating gateway webhook loss and recovery during reconciliation

## Risks

- [ ] **Gateway API changes / format drift**: strict schema validation on incoming settlement reports
