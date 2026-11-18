# T-4403 · Web Analytics (GA4, Meta Pixel, Funnel Conversions) — **SUPERSEDED: distributed**

- **Stage**: M3 (v1 launch gate) · **Tags**: frontend, integration · **Complexity**: junior · **Depends on**: T-030, T-053, T-4402
- **StoryPoints**: 3
- **Status**: 🔄 **Distributed** — product analytics → T-4575…T-4589 (Amplitude), marketing web contour GA4/GTM → T-4590…T-4604; Meta Pixel out of scope (no separate task)

## What

**This task has been distributed; no standalone implementation exists.** Product analytics for the entire product (web + mobile client/admin + server events) is handled in Amplitude: **T-4575…T-4589**. Marketing public web contour (GTM as versioned layer, GA4 property, curated subset of events, consent/privacy, key events, validation) — **T-4590…T-4604**.

Requirement distribution:
- Acquisition funnel (`page_view`, `cta_booking_click`) → T-4577 (Amplitude, product) + T-4592/T-4596 (GA4, marketing)
- Auth funnel (`auth_otp_verified`) → T-4578 (Amplitude) + T-4596 (GA4 key event)
- Booking funnel (steps) → T-4579 (Amplitude) + T-4597 (GA4 + server outcomes)
- UTM attribution (T-053) → T-4576/T-4579 + T-4592 (`entry_point`, URL parameter allowlist)
- Server validation / duplication of critical events → T-4587 (outbox; GA4 Measurement Protocol expanded in T-4597)
- GA4 + GTM as such → T-4590…T-4604; DB reconciliation and gate before ads → T-4603
- **Meta Pixel (Meta CAPI) — out of scope.** Previous version deferred it "as needed"; no separate task in index. Create as separate task only when Meta ads require server-side events.

## Why

Amplitude provides: cross-device identity merge (one User per phone), server-side event guarantee, product analytics (funnels, retention, cohorts), KPI dashboard (phase 14) — in a single tool. GA4 does not duplicate product analytics, but covers what Amplitude doesn't for marketing: ad attribution, key events, bidding audiences, Google Ads & Search Console integration (T-4598, T-4599).

## Sources

- products.md §1 (analytics: events "successful OTP", "CTA booking")
- web-cabinet-screens.md §1 (cabinet events → T-4576/T-4580)
- T-053 (UTM parser, default `direct`)
- T-4575…T-4589 (Amplitude), T-4590…T-4604 (GA4/GTM), T-4402 (consent)

## Done

- [x] ~~GA4 connected on web and book; OTP/funnel/CTA events fire~~ → **T-4591, T-4593, T-4596, T-4597**
- [x] ~~Booking funnel visible broken down by utm_source/medium/content~~ → **T-4579 (Amplitude) + T-4592/T-4594 (GA4 dimensions)**
- [x] ~~Meta Pixel with consent; refusal = pixel not loaded~~ → **out of scope, no separate task created (as needed)**
- [x] ~~Successful booking event verified against DB (source of truth — booking)~~ → **T-4587 (Amplitude) + T-4603 (GA4 ↔ DB reconciliation)**

## Risks

- [ ] **AdBlock/ITP**: part of client traffic invisible — duplicate critical events server-side (T-4587 + Measurement Protocol in T-4597)
- [ ] **PII in trackers**: no phones/OTP/comments — only `user_id` (UUID), `anon_id`, allowlist (T-4601)
- [ ] **GA4 ↔ DB discrepancy**: last-click, consent-loss, MP clients — expected, documented in T-4598/T-4603, not a "bug to fix"
- [ ] **Two event systems**: names from T-4576 shared by both; renaming breaks both GA4 and Amplitude (T-4595)
