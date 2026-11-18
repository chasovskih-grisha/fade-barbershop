# T-4450 · Loyalty Program Configuration

- **Stage**: M4 (phase 8) · **Tags**: backend, loyalty · **Complexity**: middle · **Depends on**: T-140, T-141
- **StoryPoints**: 5

## What

Unified configuration for loyalty rules (T-140/141): accrual scheme (percentage or points per currency unit, rounding), minimum threshold for participation, expiration limits, redemption rules (spending), with per-location overrides.

## Why

Flexibility for different studios and promotional campaigns without hardcoded constants.

## Sources

- LYL-001…007; loyalty README
- ADR 0009

## Done

- [ ] Loyalty settings schema and API/admin CRUD
- [ ] Engine reads active configuration during accrual and redemption
- [ ] Tests covering rounding, thresholds, and expiration

## Risks

- [ ] **Config changes apply retroactively?** Rule: applies to future accruals unless explicitly versioned; old points retain their terms.
