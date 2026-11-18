# T-4466 · Loyalty Program Cost Report

- **Stage**: M5 (phase 10) · **Tags**: backend, analytics, finance · **Complexity**: junior · **Depends on**: T-141, T-110
- **StoryPoints**: 3

## What

Monthly "loyalty cost" financial report: amount of awarded points in currency equivalent, used points, value of unused points (reserve), breakdown by locations and sources; forecast "issuing points faster than redeeming". The report is built on accrual/redemption events (T-141), linked to the calendar.

## Why

Points without value are a hidden financial liability; the report shows whether the program pays off (T-140 ≠ an end in itself).

## Sources

- loyalty README; analytics README; T-141, T-110 (reports), financial accounting

## Done

- [ ] Report by months/locations (awarded-redeemed-reserve)
- [ ] "Growing reserve" forecast visible to the operator
- [ ] CSV export with event log

## Risks

- [ ] **Point exchange rate**: point value is fixed from configuration (T-4450), not recalculated arbitrarily — test
