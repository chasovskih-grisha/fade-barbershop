# T-021 · Locations: CRUD, Chairs, Deactivation

- **Stage**: M1 (phase 2) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-020
- **StoryPoints**: 5

## What

`locations` context + admin screens §1: list/form (code unique, coordinates for map), hours editor, chairs (active/inactive), deactivation with confirmation ("N active visits are not cancelled"). Deactivated location disappears from the website and booking flow immediately (MNG-ADM-02).

## Why

Data source for website, booking, slots; first admin data table.

## Sources

- `MNG-ADM-01…04`; `admin-screens.md` §1; `web-screens.md` §1–2 (consumption)

## Done

- [x] CRUD + chairs + hours work; deactivation hides location everywhere
- [x] Form validation per §1.2 (code uniqueness is server-side)

## Risks

- [ ] **Migrations**: schema changes break existing data — migration with backfill plan
- [ ] **Domain events**: subscriptions are idempotent (ADR 0009/0016 pattern)
