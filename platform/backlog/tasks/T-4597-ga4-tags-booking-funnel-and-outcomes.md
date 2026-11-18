# T-4597 · GTM/GA4 Tags: Booking Funnel and Server Outcomes

- **Stage**: M3 (phase 4 — scheduling) · **Tags**: frontend, backend, analytics, conversion, data-quality · **Complexity**: middle · **Depends on**: T-4596, T-4579, T-4587, T-4536, T-041
- **StoryPoints**: 8

## What

Complete booking funnel in GA4 — from first step to confirmation — plus server outcomes that physically do not exist in the browser (payment success, cancellation, no-show).

## Why

Accurate marketing attribution (ROAS) depends entirely on reliable booking conversion tracking without double-counting between browser and server.

## Sources

- T-041, T-053, T-4579, T-4587, T-4536

## Done

- [ ] Booking funnel events correctly sent from frontend
- [ ] Server-side Measurement Protocol forwarding for payment and status updates
- [ ] Playwright assertions verifying zero double-counting
- [ ] GA4 DebugView validation completed

## Risks

- [ ] **Double counting**: browser client event + server Measurement Protocol event firing for the same conversion — strictly managed via measurement matrix and deduplication keys.
