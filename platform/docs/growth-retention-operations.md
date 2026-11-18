# FADE — Customer Acquisition & Retention Operations Report

## Overview
This document outlines the operational framework, growth metrics, and retention flows managed by **FADE** (Customer Acquisition & Retention Specialist) on the `stage` branch of `Projects/barbershop/platform`.

---

## 1. Acquisition Contour: Referral Program ("Bring a Friend")
- **Mechanism**: Two-sided incentive. Friend receives first-visit discount; client receives referral reward discount upon successful completion of friend's appointment (`AppointmentCompleted`).
- **Attribution & Anti-Abuse**:
  - Last-touch attribution (30 days immutable).
  - Strict fraud check (self-referral prevention, IP/device heuristic analysis, one reward per unique referred client phone/profile).
- **Domain Modules**:
  - `apps/api/src/referrals/domain/referral.entity.ts`
  - `apps/api/src/referrals/application/referral.use-cases.ts`
  - Unit tests: `apps/api/src/referrals/referral.spec.ts`

---

## 2. Retention Contour: Win-Back & Reactivation Campaigns
- **Mechanism**: One-click orchestration for dormant client segments (sleeping ≥ 60 days, no second visit, former VIPs, high loyalty progress).
- **Core Rules**:
  - **WNB-001**: Segment + promotional template + push notification.
  - **WNB-003**: Personal campaign discount code (1 usage per segment client, N days validity).
  - **WNB-006**: Anti-spam throttling (maximum once per 30 days per segment).
- **Domain Modules**:
  - `apps/api/src/campaigns/domain/campaign.entity.ts`
  - `apps/api/src/campaigns/application/campaign.use-cases.ts`
  - Unit tests: `apps/api/src/campaigns/campaign.spec.ts`

---

## 3. Client Onboarding Sequence
- **Mechanism**: Multi-step onboarding tracking from registration to first completed visit, paired with push notifications and introductory incentives.
- **Domain Modules**:
  - `apps/api/src/onboarding/domain/onboarding.entity.ts`
  - `apps/api/src/onboarding/application/onboarding.use-cases.ts`
  - Unit tests: `apps/api/src/onboarding/onboarding.spec.ts`

---

## 4. Growth KPIs & Analytics Integration
- **CAC vs LTV**: Tracking referral acquisition cost (zero ad budget) against customer lifetime value.
- **Win-Back ROI**: Revenue generated via reactivation campaign discount codes divided by total sent count.
- **Conversion Funnel**: Clicks → Registrations → Completed Visits (Referral vs Organic).
