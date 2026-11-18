# T-4540 · Calendar sync boundary: ICS export vs OAuth bidirectional (P0)

- **Stage**: M4 (phase 16+) · **Tags**: backend, integration, experimental · **Complexity**: senior · **Dependencies**: T-045, T-3102, T-4446
- **StoryPoints**: 8

## What

Separation of two calendar integration scenarios:
1. **ICS export (v1)**: Static link `GET /calendar/export.ics?barberId=...&token=...` — read-only, updates on request, no conflicts. Used by barber in Google Calendar / Outlook / Apple Calendar for viewing.
2. **OAuth bidirectional (post-v1)**: Full sync with Google Calendar / Microsoft 365 — conflicts, merge, provider as source of truth for free time.

Task: **fix boundaries** — ICS in v1, OAuth in M5/M6 with separate ADR. Remove/not implement OAuth in v1.

## Why

Avoid scope creep: T-4446 (add to calendar) implemented ICS; T-3102 (integrations) plans OAuth. Need clear decision: OAuth doesn't block v1.

## Requirement sources

- T-4446 (add-to-calendar links), T-3102 (integrations platform), T-045 (admin calendar)
- Canvas decision: "Keep add-to-calendar links in v1; define OAuth/bidirectional sync as post-v1 integration scope"

## Done

- [ ] ADR 00XX: Calendar Integration Strategy (ICS v1, OAuth post-v1)
- [ ] ICS endpoint: RFC 5545 generation, 5 min caching, access token (no authorization, but unguessable)
- [ ] Documentation for barber: "How to add FADE calendar to Google Calendar"
- [ ] Test: ICS validates in Google/Apple/Outlook validators

## Risks

- [ ] **Barbers expect two-way sync** — clear communication: "read-only in v1, two-way later"
- [ ] **ICS doesn't update in real time** — 5 min cache + push updates (optional) acceptable for v1
