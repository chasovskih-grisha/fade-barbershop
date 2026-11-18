# T-4551 · Loyalty: Programs, Points, Cashback, Tiers, Earning/Spending Rules, Referrals

- **Stage**: M4 (phase 11) · **Tags**: backend, crm, marketing · **Complexity**: senior · **Depends on**: T-140, T-141, T-142, T-4450, T-220, T-4544
- **StoryPoints**: 13

## What

Extension of loyalty (T-140/141/142/4450) into a flexible system:
- **Loyalty programs**: Multiple programs (e.g., "FADE Club" — points, "VIP Club" — cashback), versioning
- **Points system**: accrual per visit (base rate), check amount (%), specific services (multiplier), referral (T-220), birthday, review (T-150)
- **Cashback**: % of check amount, balance accumulation, spending on payment (T-4549)
- **Bonus balance**: combined balance (points + cashback in UAH), exchange rate conversion
- **Earning rules**: configurable rules (JSON logic) — events, amounts, multipliers by barber/service/time (off-peak bonus)
- **Spending rules**: minimum balance for redemption, max % of check, non-combinable with other discounts (DSC-003 cap 30%)
- **Expiration rules**: points expire after N days of inactivity, or fixed date (annual cycle)
- **Tiered loyalty**: tiers (Bronze/Silver/Gold/Platinum) with benefits (higher cashback %, free add-ons, priority waitlist T-4453)
- **Manual adjustments**: admin balance correction (compensation, bonus) with reason and audit (T-4216)
- **Loyalty transaction history**: complete log of accruals/spendings/expirations linked to appointment/payment/campaign
- **Loyalty reports**: issued/spent/expired, average check loyal vs new, retention by tier

## Why

Flexible retention system adapting to business goals. Current T-140 is only "7th visit free".

## Sources

- T-140/141/142 (loyalty core), T-4450 (loyalty config), T-220 (referrals), T-4544 (CRM), T-150 (feedback)
- Altegio: loyalty programs, points, cashback, tiers, earning/exchange rules, transaction history

## Done

- [ ] Domain: `LoyaltyProgram`, `LoyaltyAccount` (clientId, programId, pointsBalance, cashbackBalance, tier, tierProgress), `LoyaltyTransaction` (type: EARN/SPEND/EXPIRE/ADJUST, amount, source, appointmentId, campaignId)
- [ ] Rules engine: JSON logic for earning/spending (T-4556), rule versioning
- [ ] Tier calculation: scheduled job daily recalculates tier based on the last year
- [ ] Integration: `AppointmentCompleted` → `LoyaltyPointsEarned`, `PaymentCompleted` → `CashbackAccrued`, `ReferralRewardGranted` (T-220)
- [ ] Admin UI: Loyalty dashboard — programs, rules, tiers, transactions, manual adjustments
- [ ] Client cabinet: balance, tier progress, transaction history (T-4543)
- [ ] Reports: issued/spent/expired for period, loyalty ROI

## Risks

- [ ] **Liability**: points = business liability — accounting compliance (T-4216)
- [ ] **Fraud**: self-accrual of points — via domain events only, not client API
