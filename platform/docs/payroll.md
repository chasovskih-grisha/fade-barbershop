# Payroll — current state and decision boundaries

> **Status:** real minimum (2026-09-24). Not phantom: document fixes what **already exists** in data/code and what decisions founder must make at T-3300 start. This not engine spec — it's written by T-3300, relying on this state.

## 1. What already exists (data sources engine must consider)

- **Services catalog with prices by location**: `Service` + `ServicePrice` (whole money amount, `active`), price snapshot fixed in `Booking` at booking moment (migration `20261002000000_service_location_prices_and_booking_snapshot`) — point revenue calculated by snapshots, not current price list.
- **Who provided service**: `Booking.barberId` (can be "any" — engine must check actual provision), parallel service provision — `parallelDuration` (combo on two chairs).
- **Procedural consent to pay for work**: no separate payout/accrual tables in schema — no code makes compensation model assumptions.
- **Working time accounting**: barber schedules (`AvailabilityWindow`, self-schedule — phase 22) — actual shift ≠ schedule; engine must decide whether to reconcile them.

## 2. Decisions founder must make (before T-3300 code)

1. **Model**: % from revenue / fixed rate per shift / hybrid; whether depends on location and service category.
2. **Calculation base**: booking snapshot price vs actually paid (discounts, certificates, store — phases 13/20/27 change base).
3. **Tips**: distribution method (cash/card), whether enter payroll base and tax reporting — link with T-4212 (tip-management) and Checkbox (phase 8).
4. **Periods and payouts**: calculation period (week/month), payout date, advances/retentions.
5. **Rights and privacy**: who sees others' accruals (ADR 0027 — admin role single in v1; barber sees only own, or not at all).

## 3. Limitations already fixed by other documents

- Money — whole units (cents), without float (engineering-principles, ubiquitous-language).
- Tax contour (FPRPO, Z-reports) — phase 8 / CLT-01 launch checklist; payroll doesn't duplicate fiscal module.
- Accrual change audit — by `CatalogAudit` pattern (who/when/changed what); period record deletion forbidden — only correction.

## 4. When this document updates

At T-3300 start (payout engine) and T-4212 (tips): §2 decisions move into accepted spec of corresponding task, here remains link to it. Document doesn't replace AC — acceptance criteria written in `docs/acceptance-criteria/` as SPY-*/PAY-* by traceability rules.
