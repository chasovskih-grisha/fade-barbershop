# ADR 0014: Referral program — attribution in `crm`, rewards in `discounts`

- Status: accepted
- Date: 2026-09-11
- Contexts: `crm` (attribution), `discounts` (referral discount and reward), `scheduling` (trigger), `notifications` (notifications)

## Context

"Bring a friend" — cheapest growth for point: referred client comes with trust not bought by ads. Architecture question: where program lives — separate context, or orchestration of existing — and how to separate **timing** of two rewards: friend gets discount **before** first visit, referrer — **after** friend's visit completion (otherwise fraud: registrations for reward without visit).

## Decision

### 1. No new context — orchestration on events

Program doesn't introduce new language: "referred client" — `ClientProfile` with `ReferredBy`; "invitation discount" — regular promo code type in `discounts`; "reward" — referral discount on next visit. New context would duplicate CRM links and second discount mechanism. Comparison with neighboring features: waitlist lives in `scheduling`, because changes calendar (ADR 0012); certificates — separate context, because have own balance and validity (ADR 0013); referral **owns neither calendar nor balance** — nothing to own.

### 2. Attribution — `crm` ownership, last touch, 30-day window

- On referrer's `ClientProfile` — `InviteCode` (generated at profile creation); on friend's profile — `ReferredBy: ClientProfileId` + date/source fixation.
- Fixed at friend's **first registration** (first successful OTP): last referral touch within 30-day window (RFR-004). After registration attribution **immutable** — no reinstallation/reassignment, correction only by admin cancellation.
- Attribution independent of booking: registration without visit — still "referred client" for analytics (funnel click → registration → visits).

### 3. Two rewards — two different mechanisms with different triggers

- **Referee (friend)**: referral-type promo code in `discounts`, **applied automatically** at referred client booking (if program active) — before first completed visit; fixed on `AppliedDiscounts` as always (ADR 0007). This "discount before visit".
- **Referrer**: trigger — **friend's `AppointmentCompleted`** (same event as loyalty in ADR 0009, idempotency by `AppointmentId`). Reward — referral discount with 90-day validity, applied as regular discount with DSC-003 cap. This "reward after visit" — fraud control by construction.
- Cancellation: 2 consecutive no-shows by friend → reward cancellation (NSH-006 semantics); admin cancellation with reason and log.

### 4. Combination: referral replaces "First visit", cap applies

Referred client by definition doesn't need "first visit" rule (DSC-RULE-01): referral discount applied **instead** of it — take more beneficial. Otherwise — general DSC-003 stack rules (referral as rule-type doesn't combine with VIP/promo code; cap 30% limits). Referrer reward — regular discount in same cap.

### 5. Notifications to both sides — via `notifications`

Invitation (friend): "{name} invites: −15% on first visit" + link with code. Accrual (referrer): "Friend completed visit — your discount awaits". Both — push; SMS — out of feature.

## Consequences

- **Pros**: zero new aggregates — `InviteCode`/`ReferredBy` (two fields in `crm`) + referral type in `discounts`; referral vs organic funnel calculated in `analytics` from existing events (`UserRegistered`/`ClientRegistered` + `ReferredBy` + `AppointmentCompleted`); anti-abuse rules centralized in one place (admin review RFR-ADM-03).
- **Cost**: "last touch" holds list of referral touches on friend device/session before registration (localStorage/web session, deep-link params in mobile) — simple mechanism, but **outside domain** (client state, not aggregate).
- **Future**: two-way certificate rewards, tier rewards (3 friends → bigger discount), referral win-back campaigns (WNB × RFR) — extensions of same mechanism.

## Rejected alternatives

1. **Separate `referrals` context** — would duplicate CRM links and introduce second discount mechanism; owns nothing independently.
2. **Reward at friend registration** (without visit completion) — opens fraud: mass registrations for reward; fixes motivation "bring one who comes", not "bring registration".
3. **Reward at friend booking** — middle variant: booking without completion (and no-show) eats economics; completion — only honest trigger.
4. **Loyalty progress +1 as reward** — mixes "completed visits" counter (ADR 0009) with marketing bonus; breaks invariant 9.
