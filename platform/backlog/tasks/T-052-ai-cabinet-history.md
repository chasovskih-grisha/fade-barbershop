# T-052 · Generation History and Appointment Attachment

- **Stage**: M1 (phase 10A) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-050, T-051, T-043
- **StoryPoints**: 5

## What

"AI Selection" section in cabinet/profile (history with statuses, "This variant", "Generate again"), attaching variant to booking (REF-WEB-02 — source "From AI Selection" on screen 4), deleting photo/results anytime (AI-WEB-07), offline/errors — banner (AI-WEB-08).

## Sources

- `AI-WEB-04…08`, `REF-WEB-02`; `web-cabinet-screens.md` §2, `client-screens.md` §5

## Done

- [ ] Variant is attached to booking and visible to barber (together with T-100)
- [ ] Deletion works immediately (bucket + projections)

## Risks

- [ ] **Migrations**: schema changes break existing data — migration with backfill plan
- [ ] **Domain Events**: subscriptions are idempotent (pattern ADR 0009/0016)

## Blocking evidence

`apps/api/src/haircut-ai` stores no selection history: no route or table carries a saved AI variant, so the cabinet section would have nothing to list and no way to attach a variant to a booking (`REF-WEB-02`). It needs the AI selection persistence slice first.
