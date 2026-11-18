# T-060 · ClientProfile: Profile, Preferences, Notes

- **Stage**: M2 (phase 5) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-020, T-010
- **StoryPoints**: 5

## What

`crm` context: client card (profile, preferences from client profile), barber/admin notes (author, visibility — not client), admin screens §6 (list with search, card with VIP field and loyalty — phase 11/13 gates).

## Why

Core customer CRM data; foundation for visits, loyalty, and personalization.

## Sources

- `MNG-ADM-16`; `admin-screens.md` §6; crm README; `barber-screens.md` §4.3 (consumption)

## Done

- [ ] Client card works in admin panel
- [ ] Notes with authorship and restricted visibility

## Risks

- [ ] **Migrations**: schema changes break existing data — migration with backfill plan
- [ ] **Domain events**: subscriptions are idempotent (ADR 0009/0016 pattern)
