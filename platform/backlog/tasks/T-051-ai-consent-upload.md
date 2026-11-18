# T-051 · AI Photo Upload and Consent

- **Stage**: M1 (phase 10A) · **Tags**: backend, frontend · **Complexity**: middle · **Depends on**: T-050
- **StoryPoints**: 5

## What

Upload (jpg/png/webp ≤ 10 MB, ≥ 800×800 — AI-WEB-01; mobile: camera/gallery — AI-MOB-02), **modal consent before first generation** (AI-WEB-02, in Ukrainian), processing statuses with estimated time, page can be left (AI-WEB-03). Invalid photo — clear error without losing limit (AI-WEB-06).

## Sources

- `AI-WEB-01…06`; `booking-flow.md` screen 4 (AI inline)

## Done

- [ ] Consent is recorded before the first generation
- [ ] Photo validations and errors per criteria

## Risks

- [ ] **Migrations**: schema changes break existing data — migration with backfill plan
- [ ] **Domain Events**: subscriptions are idempotent (pattern ADR 0009/0016)
