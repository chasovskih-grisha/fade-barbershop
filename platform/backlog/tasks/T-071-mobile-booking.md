# T-071 · Mobile booking (steps 0–5)

- **Stage**: M2 (phase 6) · **Tags**: backend, frontend · **Complexity**: middle · **Depends on**: T-070, T-040
- **StoryPoints**: 5

## What

Same flow, mobile differences `booking-flow.md`: separate screens with progress, back-gesture, tap-selection of cards, camera as source for AI photos (AI-MOB-02), offline — "no connection", photo is not lost (AI-MOB-03).

## Sources

- `booking-flow.md` (Mobile differences); `client-screens.md` §1–3; AI-MOB-*

## Done

- [x] Flow pass on iOS/Android
- [x] GWT flow scenarios executed on mobile branches

## Risks

- [ ] **Migrations**: schema change breaks existing data — migration with backfill plan
- [ ] **Domain events**: subscriptions are idempotent (ADR 0009/0016 pattern)
