# Admin Panel — Referrals Domain

## Purpose
Referral program ("bring a friend"). Handles program configuration (discount %, reward, validity), referral list with status tracking, anti-abuse pattern detection, and attribution rules (30-day window, 1 use per client).

## Pages & Features
- **Referral Program Setup** (`RFR-ADM-01`)
  - **Fields**: Referral discount (%) — awarded to client who refers a friend, applied to friend's first visit; Reward (% / UAH) — awarded to referrer after friend completes first visit; Validity days for reward (90 days default); Toggle "Program enabled"
  - **Validation**: Discount 1–100%; Reward ≥ 0; Validity > 0 days

- **Referral List** (`RFR-ADM-02`)
  - **Layout**: Table with columns: Friend, Who referred, Registration date, Status (registered / completed visit), Reward status (waiting / accrued / cancelled), Actions (Cancel reward)
  - **Empty state**: "No referrals yet."
  - **Statuses**: 
    - `registered` — friend signed up but hasn't completed first visit
    - `completed` — friend finished first visit; reward becomes eligible
    - `awarded` — reward given to referrer; marked accrued
    - `cancelled` — reward a nulled (admin reason)

- **Anti-Abuse Oversight** (`RFR-ADM-03`)
  - **Suspicious patterns**: Shared phones between referrer/referred; registration series from one device; series of no-shows by referred clients
  - **Manual review**: Admin can review flagged patterns; a nulll with reason and log
  - **A nulllation**: Reward a nulllled with reason; log required (RFR-005); referred client's registration may be flagged

## API Endpoints
Referral API under the referral module:

- `GET /admin/referrals/program` — Get program configuration
- `PATCH /admin/referrals/program` — Update program (discount, reward, validity, enable/disable)
- `GET /admin/referrals/list` — List referrals with filters (status, date range)
- `POST /admin/referrals/:id/reward` — Manually award/reward referrer (after friend's completed visit)
- `POST /admin/referrals/:id/cancel-reward` — Cancel referral reward with reason
- `GET /admin/referrals/analytics` — Referral conversion rate, top referrers, abuse flags

## DTOs (inferred)
- `ReferralProgramDto`: discountPercent, rewardType (`percent` / `fixed`), rewardValue, rewardValidityDays, enabled
- `ReferralDto`: id, referrerId, referredId, referralCode, registrationDate, firstVisitDate?, status (`registered` / `completed` / `awarded` / `cancelled`), rewardStatus (`waiting` / `accrued` / `cancelled), abuseFlags (array), createdAt
- `RewardDto`: id, referrerId, amount, status, awardedAt, transactionId

## Business Rules
- **Referral discount**: Percentage or fixed amount off friend's first visit; replaces "First visit" rule (DSC-RULE-01) if active; automatic application at booking if `ReferredBy` field present
- **Referrer reward**: Awarded to referrer after referred client completes their first visit; reward type: % (discount on next visit) or fixed UAH; validity N days (default 90); awarded status: `waiting` → `accrued` → paid/manual
- **Attribution window**: 30 days from referrer's share link / code generation; referred registration must occur within 30 days of first touch (last touch before registration, ADR 0014)
- **1 use per client**: Referred client can only use referral once; subsequent visits full price; new referrals only via new code
- **Anti-abuse**: Shared phones between referrer/referred flagged; registration series from one device flagged; series of no-shows by referred clients reviewed; admin can a nulll with reason
- **Reward payment**: After friend's `AppointmentCompleted` → referrer reward status changes from `waiting` to `accrued`; paid out on next referrer visit or transferred to account; lógico audit trail

## Permissions
- `admin` role only (v1)
- Direct URL access without role → 403
- Referrer sees own referrals in mobile cabinet; location_manager sees own location referrals (phase 9+)

## Development Notes
- Referral code: generated at client registration; stored in `crm` context (InviteCode/ReferredBy); not in `identity`
- 30-day window: `referredRegistrationDate` must be within 30 days of `referralCodeGeneration` or `referrer's last touch`; enforced at referral creation
- Reward accrual: triggered by `AppointmentCompleted` event of referred client; checks `ReferredBy` field; increments referrer's reward counter
- Reward payment: referrer can see accrued reward in their profile; can apply to next visit or request payout; integration with billing for UAH rewards
- Abuse detection: rules engine checks new referrals against patterns; flags reviewed in admin UI; a nulll action changes status and logs reason
- Referral discount automatic: at booking, if `ReferredBy` present on client → discount applied from `ReferralProgramDto`; no promo code needed (though can coexist within 30% cap)

## Important Edge Cases
- Referred client's first visit: discount applied automatically; if combined with promo code or VIP, total cap 30% (DSC-003) applies
- Referrer reward: only awarded after friend's first visit completes; no reward for cancelled/no-show first visits
- 1 use per client: referred client's second+ visit full price; can start new referral with new code if desired
- Abuse a nulllation: admin a nullls reward and/or flags referred client; reason required; logged; may prevent future referrals from same referrer/phone
- Program disabled: new referrals not generated; existing pending referrals still complete; program can be re-enabled later
- Conversion rate: referred clients who complete first visit / total referrals generated; tracked in analytics

## Links to Related Documentation
- `docs/acceptance-criteria/17-referral-program.md` (RFR-ADM-01…04)
- `docs/acceptance-criteria/05-loyalty-free-visit.md` (LYL linkage, referral may replace first-visit rule)
- `docs/acceptance-criteria/07-discounts.md` (DSC-ADM-01 — promo code synergy, DSC-003 cap 30%)
- `docs/acceptance-criteria/08-analytics-dashboard.md` (referral conversion tracking in KPI)
- `docs/ubiquitous-language.md` (ReferralDiscount, InviteCode, ReferredBy, ReferralReferral, ReferralReferral, ReferralDiscount)
- `products.md` (§13 — referrals, §7 — discounts referral interactions)
- `docs/roadmap.md` (phase 21 — referral program; phase 13 — discounts referral parte)
- `docs/admin-screens.md` (§13 — referrals)
- `docs/adr/` (ADR 0014 — referral attribution 30-day window; ADR 0005 — single User)