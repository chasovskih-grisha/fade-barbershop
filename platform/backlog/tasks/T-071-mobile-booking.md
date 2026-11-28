# T-071 · Mobile booking (steps 0–5)

- **Stage**: M2 (phase 6) · **Tags**: backend, frontend · **Complexity**: middle · **Depends on**: T-070, T-040
- **StoryPoints**: 5

## What

Same flow, mobile differences `booking-flow.md`: separate screens with progress, back-gesture, tap-selection of cards, camera as source for AI photos (AI-MOB-02), offline — "no connection", photo is not lost (AI-MOB-03).

## Sources

- `booking-flow.md` (Mobile differences); `client-screens.md` §1–3; AI-MOB-*

## Done

- [ ] Flow pass on iOS/Android
- [ ] GWT flow scenarios executed on mobile branches

## Audit 2026-11-24

Reopened. `T-071a` now owns the real slots/booking/deposit flow and is done: the
fake `buildSlots()` path is deleted. This parent still needs the camera/AI
reference step, the offline/no-connection state, and recorded iOS/Android and
GWT passes; the current Done claims have no device evidence.

## Reassessment 2026-11-25

T-071a is verified complete: the local pseudo-slot path is gone from the code, and the
booking API, deposit and lint checks are recorded in that task's QA section (16/16
focused tests). The iOS/Android device pass was not run, so T-071 stays open for:

- device flow pass (tap-selection, back gesture, deposit on hardware) on iOS and on Android
- the AI/camera reference step (AI-MOB-02)
- the offline/no-connection state (AI-MOB-03)
- GWT flow scenarios executed on the mobile branches

No new code slice is needed for the booking API itself.

## Risks

- [ ] **Migrations**: schema change breaks existing data — migration with backfill plan
- [ ] **Domain events**: subscriptions are idempotent (ADR 0009/0016 pattern)
