# T-4553 · Promotions & discounts engine: flexible rules, promo codes, eligibility, caps

- **Stage**: M4 (phase 13) · **Tags**: backend, marketing, billing · **Complexity**: senior · **Depends on**: T-152, T-153, T-4450, T-4522, T-4544, T-4545
- **StoryPoints**: 13

## What

Expanding discounts (T-152/153/4450) into a flexible promotions engine:
- **Discount types**: percentage, fixed amount, service-specific, barber-specific, time-based (happy hours), client-segment-specific (T-4545)
- **Promo codes**: unique codes, usage limits (total/per client), validity dates, campaign association (T-3101), minimum spend
- **Automatic promotions**: code-free rules — "first visit -20%", "birthday -15%", "off-peak 10-14h -10%", "VIP -20%" (T-4545 segments)
- **Eligibility rules**: JSON logic (T-4556) — new clients, tagged clients, clients with membership, clients with Gold+ loyalty
- **Stacking rules**: DSC-003 (cap 30% total), priorities (promo code > automatic > VIP > membership), mutual exclusion
- **Usage limits**: per client, per campaign, global, time-based
- **Date validity**: fixed dates, rolling windows (last 30 days), recurring (every Tuesday)
- **Discount history**: usage log (appointmentId, discountId, amount, ruleVersion) for audit (T-4216)
- **Admin UI**: Promo Code Manager, Automatic Rules Builder (visual), campaign association, revenue impact preview

## Why

Marketing campaigns require flexible, versioned rules with limits. Current DSC is basic.

## Sources

- T-152/153 (discounts), T-4450 (loyalty config), T-4522 (slot policy), T-4544 (CRM), T-4545 (segmentation), T-3101 (campaigns)
- Altegio: kody promocyjne, zniżki automatyczne, reguły, limity, historia zastosowań, stackowanie

## Done

- [ ] Domain: `Promotion` (type: CODE/RULE, config: JSON logic, validity, limits, stackingPriority, capPercent), `PromotionUsage` (clientId, promotionId, appointmentId, usedAt)
- [ ] Engine: evaluation during `FinalPrice` calculation (billing) — sequence: base price → automatic rules → promo code → VIP → membership → loyalty → cap 30%
- [ ] Promo code validation: real-time in booking flow (T-041/053), admin panel (T-046)
- [ ] Automatic rules: scheduled evaluation for time-based (happy hours), event-based (first visit, birthday)
- [ ] Admin UI: CRUD for promotions, codes, rules; preview "how many clients are currently eligible"
- [ ] Analytics: conversion by promo codes, revenue impact, ROI of campaigns (T-3201)

## Risks

- [ ] **Rule conflicts**: DSC-003 cap 30% — hard constraint in engine, validation upon rule creation
- [ ] **Performance**: evaluation on every booking — caching eligible promotions for the client (TTL 5 min)
