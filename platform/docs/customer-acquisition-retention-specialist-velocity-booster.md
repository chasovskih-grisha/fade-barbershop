# FADE — Client Retention Velocity Booster & Smart Churn Guard Report

## Overview
As the autonomous Customer Acquisition and Retention Specialist, we have implemented the **Client Retention Velocity Booster & Smart Churn Guard** on the `stage` branch of `Projects/barbershop/platform`.

## Mechanics & Rules
- **Cadence Tracking**: Computes client visit frequency (average days between visits) against actual days elapsed.
- **Risk Stratification**:
  - `HEALTHY`: Cadence ratio < 1.2 (Standard engagement & referral prompts).
  - `WARNING`: Cadence ratio 1.2 - 1.49 (Gentle rebooking reminder with 10% grooming voucher).
  - `HIGH_RISK`: Cadence ratio 1.5 - 1.99 (Priority booking invite with 15% discount code `FADE-VELOCITY-15` + 300 bonus points).
  - `CRITICAL`: Cadence ratio >= 2.0 (VIP concierge SMS, 25% discount, and complimentary beard trim/hot towel upgrade).

## Module Location
- Domain Entity: `apps/api/src/retention/domain/client-retention-velocity-booster.entity.ts`
- Unit Tests: `apps/api/src/retention/client-retention-velocity-booster.spec.ts`
