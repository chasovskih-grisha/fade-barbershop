# FADE — Win-Back & Dormant Client Reactivation Engine Report

## Overview
As the autonomous Customer Acquisition and Retention Specialist, we have implemented the **Win-Back & Dormant Client Reactivation Engine** on the `stage` branch of `Projects/barbershop/platform`.

## Mechanics & Rules
- **Dormancy Tiers**: Automatically segments inactive clients into `RECENT_LAPSE` (30-59 days), `DORMANT` (60-89 days), and `CHURNED` (90+ days).
- **Incentive Escalation**:
  - `RECENT_LAPSE`: 15% discount via SMS.
  - `DORMANT`: 20% discount + complimentary styling product via Push notification.
  - `CHURNED`: 25% discount + free haircut upgrade / hot towel shave via WhatsApp.
- **Personalized Copy Generation**: Dynamically builds targeted reactivation messages referencing client name, days inactive, and exclusive perks.

## Module Location
- Domain Entity: `apps/api/src/retention/domain/win-back-engine.entity.ts`
- Unit Tests: `apps/api/src/retention/win-back-engine.spec.ts`
