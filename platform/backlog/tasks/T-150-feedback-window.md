# T-150 · FeedbackWindow: subscription, 2-h push

- **Stage**: M4 (phase 12A — v1 slice per decision) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-042, T-080
- **StoryPoints**: 5

## What

`FeedbackWindow` on `AppointmentCompleted` (idempotent subscription — ADR 0016): 30-day window, `windowEndsAt` — setting snapshot; statuses open/submitted/expired/closed; submission → `Review` (stars required, text ≤ 1000, ≤ 3 photos — ADR 0015 for photos), resubmission edits (FDB-002); reminder after 2h — exactly one (FDB-MOB-02); review deletion until end of window (FDB-003). Private in first release (FDB-006 accepted); publication — phase 25.

## Sources

- `FDB-001…006` + surfaces; **ADR 0015/0016**; feedback README

## Done

- [ ] Window opens on completed visit, once
- [ ] Photos in separate bucket with review lifecycle

## Risks

- [ ] **30-day window**: idempotent creation of FeedbackWindow — ADR 0016 pattern
