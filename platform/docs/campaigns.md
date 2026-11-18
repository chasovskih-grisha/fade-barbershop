# Win-back campaigns (retention marketing)

> "Client hasn't visited ≥ 60 days" → one click admin creates **personal promo code** and sends segment **push**. Highest small point marketing ROI: returning "sleeping" clients almost free — built on existing `crm`, `discounts`, `notifications`, `analytics`. **No new context.**

> Criteria: `acceptance-criteria/11-winback-campaigns.md` (WNB-*). Phase: **18** (right after v1).

## Mechanics (one admin click)

```
Segment (crm) ──preview N clients──▶ Campaign
  → one template code → regular PromoCode in `discounts`
      (1 usage per segment client, valid N days, only segment sees)
  → push to segment (notifications): text + code + deadline
  → client books via regular flow (booking-flow) and enters code (DSC-WEB-01)
  → AppliedDiscounts → FinalPrice (ADR 0007) — regular path, no new models
  → effectiveness: used / sent (ANL extension, link with ANL-006)
```

## v1 Segments (by CRM and loyalty data)

| Segment | Condition | Source |
|---------|-------|---------|
| Sleeping | hasn't visited ≥ N days (60) | last `Visit` in `crm` |
| No second visit | exactly 1 completed visit | `VisitHistory` |
| Former VIP | VIP level removed | `crm` |
| Almost free | loyalty progress ≥ 4/7 | `loyalty` |

Segment filters (WNB-005): without anonymous (walk-in without phone), without disabled push, without clients with active booking.

## Anti-spam

- One message per client per campaign; repeated campaign on segment — no more than once per 30 days (WNB-006).
- Code not valid outside segment (WNB-003): "personal" — visibility limit, not unique code per person.

## Screens

See `WNB-ADM-01…04`: campaigns list → form (segment with live count, discount, push text with preview, confirmation "Send to N clients?") → result card (sent / used / revenue from code / ROI).

## Related

- No-show policy (phase 16) and waitlist (phase 17) — other half of retention contour: `acceptance-criteria/12-no-show-policy.md`, `14-waitlist-autofill.md`.
- Acquisition: `referrals.md` (referral — new clients; campaigns — returning existing; same push mechanics).
- Client path (branch "hasn't visited ≥ 60 days"): `client-journey.md`.
