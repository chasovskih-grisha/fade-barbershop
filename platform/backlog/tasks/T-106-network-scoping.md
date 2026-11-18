# T-106 · Network: location-scoped surfaces

- **Stage**: M6 (phase 9) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-105
- **StoryPoints**: 5

## What

Complete location scoping, established by the admin header filter: location-based analytics (ANL-ADM filters), location calendar and queues (Verify), campaigns/segments with location breakdown, manager CRM visibility (clients of their own location), "Payments" reports by location. **API scope check on every command** (UI hides, API checks — §16), including direct URLs (403).

## Why

UI filter is not security; without server-side scoping, manager role is a hole in personal data and network finances.

## Sources

- `admin-screens.md` §16 (column `location_manager`, rule "UI hides, API checks")
- ANL-ADM-01…06 (location filters); roadmap phase 9

Index — `todo` (2026-10-02). Closing on 2026-09-14 was planning: criteria below are open, manager scope on API does not exist.

## Done

- [ ] Manager sees only their location across all surfaces (verified on API)
- [ ] Founder sees the network and each location individually

## Risks

- [ ] **Migrations**: schema change breaks existing data — migration with backfill plan
- [ ] **Domain events**: subscriptions are idempotent (ADR 0009/0016 pattern)
