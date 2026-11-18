# T-022 · Working Hours Editor

- **Stage**: M1 (phase 2) · **Tags**: backend · **Complexity**: junior · **Depends on**: T-021
- **StoryPoints**: 3

## What

7 rows Mon–Sun: "Day off" + from/to with 15 min step; validation "from < to"; after saving, hours are immediately visible on the website and in slots (`OpeningHours` — input to slot validation).

## Why

`OpeningHours` is one of the three components of the "free slot" rule (T-040) and public working hours on the website.

## Sources

- `MNG-ADM-03`; `admin-screens.md` §1.3

## Done

- [x] Editor works; changes appear instantly on the website
- [x] Row validation per §1.3

## Risks

- [ ] **Migrations**: schema changes break existing data — migration with backfill plan
- [ ] **Domain events**: subscriptions are idempotent (ADR 0009/0016 pattern)
