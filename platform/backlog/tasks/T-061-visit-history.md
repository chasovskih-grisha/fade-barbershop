# T-061 · Visit History (Event-Sourced Projection)

- **Stage**: M2 (phase 5) · **Tags**: backend · **Complexity**: junior · **Depends on**: T-042, T-060
- **StoryPoints**: 3

## What

`Visit` in `crm` — read-model from `scheduling` events (idempotent, ADR 0009 pattern): visit history in client and barber cards (own — barber-scope), source of win-back segments ("has not visited ≥ N days").

## Why

`Visit` read-model allows CRM to independently read history without raw queries to scheduling context (ADR 0002).

## Sources

- crm README (`Visit`); `MNG-ADM-16`; WNB-002 (segment source)

## Done

- [ ] History collected from events; redelivery does not duplicate

## Risks

- [ ] **Migrations**: schema changes break existing data — migration with backfill plan
- [ ] **Domain events**: subscriptions are idempotent (ADR 0009/0016 pattern)
