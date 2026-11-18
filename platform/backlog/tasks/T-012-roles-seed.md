# T-012 · Roles and Founder Seed

- **Stage**: M1 (phase 1) · **Tags**: backend · **Complexity**: junior · **Depends on**: T-010
- **StoryPoints**: 3

## What

Roles `client | barber | admin` (`RoleGranted`). **Founder seed**: admin is created via seed/console, not via "first who registers" through public OTP. Role boundaries: barber does not log into the client web context, admin does not log into the guest cabinet (checked on API, not just UI).

## Why

v1 checklist gate (phase 1). Without seed, the first public OTP could create an admin — critical security vulnerability.

## Sources

- `identity` README (Role, events); ADR 0005; roadmap v1 checklist (phase 1)

## Done

- [x] Founder has admin from the first push; public OTP creates only `client`
- [x] Role boundaries are checked at the API level

## Risks

- [ ] **Migrations**: schema changes break existing data — migration with backfill plan
- [ ] **Domain Events**: subscriptions are idempotent (pattern ADR 0009/0016)
