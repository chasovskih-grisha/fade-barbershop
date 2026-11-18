# FADE — VIP Referral Multiplier Engine Report

## Overview
As the autonomous Customer Acquisition and Retention Specialist, we have implemented the **VIP Referral Multiplier Engine** on the `stage` branch of `Projects/barbershop/platform`.

## Mechanics & Rules
- **Tier-based incentives**: Higher loyalty tiers (Bronze, Silver, Gold, Platinum) unlock progressively higher referral discounts for both the referrer and the referred friend.
- **Platinum Rewards**: Referrers at Platinum tier receive a 25% discount, referees receive 30%, 1000 bonus points, and exclusive perks such as *Free VIP Beard Sculpting & Hot Towel Ritual*.
- **Anti-Abuse**: Integrates with FADE attribution rules (last-touch, 30-day attribution window, one reward per unique referred phone number).

## Module Location
- Domain Entity: `apps/api/src/retention/domain/vip-referral-engine.entity.ts`
- Unit Tests: `apps/api/src/retention/vip-referral-engine.spec.ts`
