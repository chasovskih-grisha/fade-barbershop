# T-4554 · Referrals: codes, links, tracking, rewards, fraud protection, analytics

- **Stage**: M4 (phase 21) · **Tags**: backend, crm, marketing · **Complexity**: middle · **Dependencies**: T-062, T-220, T-153, T-4544, T-4545, T-4551
- **StoryPoints**: 8

## What

Extend referral program (T-062/220) to full system:
- **Referral codes/links**: unique code per client (`web/r/{code}`, deep-link `fade://referral/{code}`), QR for print/sharing
- **Referrer tracking**: `ReferredBy` in `ClientProfile` at friend registration (last touch, 30-day window, immutable)
- **Referred client tracking**: friend status (registered / booked / completed visit / paid)
- **Referral attribution**: separate attribution (not DSC-RULE-01) — `source: REFERRAL` in `Appointment` (T-4536)
- **Referral qualification**: friend must be new client (no profile), complete visit, pay
- **Rewards**:
  - Referrer: discount/bonuses/cashback on next visit (90 days validity) — configured in loyalty (T-4551)
  - Referred: welcome discount (replaces DSC-RULE-01) — configured in promotions (T-4553)
- **Reward issuance**: automatic on friend's `AppointmentCompleted` (event `ReferralQualified`)
- **Fraud/abuse protection**:
  - One friend = one reward (check by phone/email/device)
  - 2 consecutive no-shows by friend → referrer reward cancellation
  - Admin review of suspicious patterns (many referrals per day, one IP)
- **Referral analytics**: total, converted, revenue from referrals, referral clients LTV, CAC

## Why

Viral growth, low CAC. Altegio: programy poleceń, linki, śledzenie, nagrody, antyfraud.

## Requirement sources

- T-062 (campaign attribution), T-220 (referral program), T-153 (discounts), T-4544 (CRM), T-4545 (segmentation), T-4551 (loyalty)
- Altegio: program poleceń, kody, linki, atrybucja, nagrody, antyfraud, analityka

## Done

- [ ] Domain: `ReferralCode` (clientId, code, createdAt), `Referral` (referrerId, referredId, code, status: PENDING/QUALIFIED/REWARDED/REVOKED, qualifiedAt, rewardIssuedAt)
- [ ] Registration flow: accept `ref` param → save `ReferredBy` in ClientProfile (immutable)
- [ ] Qualification: event handler on `AppointmentCompleted` → check `Referral` status → issue rewards (loyalty T-4551 + promo T-4553)
- [ ] Fraud checks: device fingerprint (T-4422), IP tracking, admin review queue
- [ ] Admin UI: referral dashboard — tree, stats, suspicious patterns, manual reward/revoke
- [ ] Client cabinet: my code/link, QR, stats (invited, converted, rewards)
- [ ] Analytics: referral funnel, CAC, referral LTV

## Risks

- [ ] **Self-referral**: client registers second "self" — device/IP/phone deduplication
- [ ] **Reward liability**: reward = obligation — accounting in loyalty transactions (T-4551)
