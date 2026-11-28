# T-4575 · Amplitude SDK Setup & Configuration (Frontend + Backend)

- **Stage**: M2 (before phase 3 — website) · **Tags**: frontend, integration, analytics · **Complexity**: junior · **Depends on**: T-030, T-4402
- **StoryPoints**: 5

## What

Connecting Amplitude SDK across all client applications and setting up server-side event forwarding for user identification.

### Web (`apps/web`) & Mobile (`apps/mobile`)
- SDK initialization with environment keys
- User identification (`setUserId`, `setUserProperties`) on login/registration
- Automatic page view tracking and standard core events

### Backend (`apps/api`)
- Server-side event forwarding (Amplitude HTTP v2 API) for critical business events (payment, booking confirmation)
- Device/session correlation

## Why

Unified product analytics and user journey attribution across all touchpoints.

## Sources

- Analytics architecture document; Amplitude developer docs

## Done

- [ ] Amplitude SDK integrated in Web and Mobile
- [ ] Backend event forwarding operational
- [ ] Test events verified in Amplitude dashboard

## Risks

- [ ] **Ad-blockers**: block client-side analytics — mitigated by server-side forwarding for critical funnel events.

### Re-verified at 78dab8f8 (2026-11-26)

No `amplitude` dependency exists in any `apps/*/package.json` or `packages/*/package.json`, and no key
or space id is configured — the account belongs to the owner. Unblock: the owner creates the project
and the key arrives as a secret; the taxonomy code side is T-5015a.

## Re-verified at 91202f68

`grep -ri amplitude apps/*/package.json packages/*/package.json` returns nothing at `91202f68`:
no Amplitude dependency, no `AMPLITUDE_API_KEY` in `infra/.env.example`, and no analytics SDK
project to send to. The taxonomy check that T-5015a plans cannot be exercised without one.
