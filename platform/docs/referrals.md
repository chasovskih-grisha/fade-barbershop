# Referral program ("bring a friend")

> Both sides get discount: friend — on **first visit**, client — **after friend's visit completion**. Growth without ad budget. **Without new context**: attribution lives in `crm`, discounts — referral type in `discounts`, trigger — `AppointmentCompleted` (ADR 0014).
>
> Criteria: `acceptance-criteria/17-referral-program.md` (RFR-*). Phase: **21**.

## Mechanics

```
Client: cabinet → "Invite friend" → code / link web/r/{code} (share)
  → Friend opens → /login → registration → ReferredBy fixed (last touch, 30 days, immutable)
  → Friend books → referral discount automatically (replaces "First visit", DSC-003 cap applies)
  → Friend visit completed (AppointmentCompleted)
  → Inviter: reward — referral discount on next visit (90 days) + push
```

## Why reward — only after completion

Registration and booking — fraud-prone triggers (mass "friends" for discount, no-show). `AppointmentCompleted` — same event that feeds loyalty (ADR 0009) and reviews: one trigger → one idempotent calculation. Cancellation: 2 consecutive no-shows by friend, admin cancellation with log.

## Anti-abuse (short)

One friend = one reward (first completed visit); referral — new client; self-referral impossible; repeated friend (same phone) doesn't give second reward; suspicious patterns review in admin (RFR-ADM-03).

## Effectiveness (ANL extension)

" clicks → registrations → completed visits" funnel referral vs organic; CAC referral ≈ 0 UAH discount vs paid traffic; LTV referral clients vs organic (RFR-ADM-04).

## Related

- Discounts: `acceptance-criteria/07-discounts.md` (referral — new type in same mechanics, 30% cap applies)
- Loyalty: `05-loyalty-free-visit.md` (same completion trigger, counter not mixed with reward)
- Campaigns: `campaigns.md` (win-back — retention, referral — acquisition; same push mechanics)
- ADR: `adr/0014-referral-program-attribution-rewards.md`
