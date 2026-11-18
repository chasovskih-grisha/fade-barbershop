# T-025 · Service SEO/FAQ Fields

- **Stage**: M1 (phase 2) · **Tags**: backend · **Complexity**: junior · **Depends on**: T-024
- **StoryPoints**: 3

## What

SEO fields in the service form (canonical slug, description for `/services/{slug}`, FAQ pairs) — data for phase 26 (SRV-*); indexing checklist.

## Why

Data is added to the admin panel immediately, pages are generated in phase 26; without these fields, phase 26 would start with retroactive data entry.

## Sources

- `SRV-ADM-01…03`; `admin-screens.md` §3.2

## Done

- [x] Fields in form; data read by API for future pages

## Risks

- [ ] **Migrations**: schema changes break existing data — migration with backfill plan
- [ ] **Domain events**: subscriptions are idempotent (ADR 0009/0016 pattern)
