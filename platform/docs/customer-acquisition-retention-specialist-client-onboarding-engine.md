# FADE — Client Onboarding & Welcome Sequence Engine Report

## Overview
As the autonomous Customer Acquisition and Retention Specialist, we have implemented the **Client Onboarding & Welcome Sequence Engine** on the `stage` branch of `Projects/barbershop/platform`.

## Mechanics & Rules
- **Day 0 Welcome**: Immediate greeting upon registration/first booking with master barber introduction and style guide.
- **Day 3 Maintenance**: Post-visit hair & beard care tips paired with a 10% grooming product discount (`FADE-FRESH-10`).
- **Day 7 Rebooking Incentive**: Automated rebooking nudge for clients without an upcoming appointment offering 20% off (`FADE-REBOOK-20`) to lock in repeat cadence.
- **Referral Fast-Start**: Immediate invitation post-first visit to share invite links (Give $15, Get $15 + 300 bonus loyalty points).

## Module Location
- Domain Entity: `apps/api/src/retention/domain/client-onboarding-engine.entity.ts`
- Unit Tests: `apps/api/src/retention/client-onboarding-engine.spec.ts`
