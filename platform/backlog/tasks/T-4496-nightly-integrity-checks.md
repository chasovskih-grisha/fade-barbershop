# T-4496 · Nightly Data Integrity Checks

- **Stage**: M6 (phase 40) · **Tags**: backend, finance, high-risk · **Complexity**: middle · **Depends on**: T-092, T-4404, T-4211
- **StoryPoints**: 8

## What

Nightly check schedule: total payments equal sum of payment types in the journal (T-4404), gift certificate balances (T-210) and loyalty points (T-141) match transactions, deposits (T-4402) do not violate rules, client/appointment records are consistent (foreign keys, statuses). Finding list with severity levels (critical/warning), alert (T-4204) on critical issues, automatic resolution for non-critical issues (or logged journal).

## Why

Payment discrepancies discovered months later are much harder to resolve ("where there's one leak, there are ten more"); regular automated checking serves as an insurance gate before reports are generated.

## Sources

- billing README; T-092/4404/210/141 (accounting), T-4211 (internal audits)

## Done

- [ ] Suite of integrity checks (finance, certificates, loyalty, bookings) running via nightly cron
- [ ] Finding severity levels + alerts on critical items; resolution audit log
- [ ] Weekly summary report (trend visibility)

## Risks

- [ ] **False positives**: thresholds set correctly to avoid alert fatigue (tolerated nanosecond drift), otherwise alerts lead to noise and are ignored
