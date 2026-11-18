# T-100 · Barber sees AI reference for visit

- **Stage**: M2 (phase 10B) · **Tags**: frontend · **Complexity**: junior · **Depends on**: T-050, T-083
- **StoryPoints**: 3

## What

Part B of phase 10: "From AI selector" source available in the appointment (already in T-043/T-052), barber sees **only the selected option and the original** (AI-BARBER-01), triggering generations outside their own visits is not allowed (AI-BARBER-02). "Processed" option — not in v1.

## Sources

- `AI-BARBER-01…02`; ADR 0008 (privacy); roadmap phase 10B

## Done

- [ ] AI reference reaches the barber in the appointment card
- [ ] Visibility boundaries verified

## Risks

- [ ] **Migrations**: schema change breaks existing data — migration with backfill plan
- [ ] **Domain events**: subscriptions are idempotent (ADR 0009/0016 pattern)
