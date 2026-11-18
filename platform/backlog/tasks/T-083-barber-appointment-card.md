# T-083 · Barber appointment card: reference, statuses

- **Stage**: M2 (phase 7) · **Tags**: frontend · **Complexity**: middle · **Depends on**: T-082
- **StoryPoints**: 5

## What

`barber-screens.md` §4.1–4.2: reference + original (for AI) + full comment, viewer "Original ↔ Reference"; statuses with one primary action ("Confirm" / "Start" / "Complete"), secondary no-show with dialog (NSH-BAR-01, phase 16 gate for auto-fixing); cancellation/rescheduling — absent; party roots (ADR 0011); payment checkbox without amounts (PAY-BARBER-01).

## Sources

- `REF-BARBER-01…05`, `NSH-BAR-01`, `PAY-BARBER-01`; `barber-screens.md` §4

## Done

- [ ] Barber status cycle works with events
- [ ] Reference/comment visible from day one (part B of phase 10 — T-100)

## Risks

- [ ] **Migrations**: schema change breaks existing data — migration with backfill plan
- [ ] **Domain events**: subscriptions are idempotent (ADR 0009/0016 pattern)
