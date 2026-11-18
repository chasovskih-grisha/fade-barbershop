# T-283 · OpsAgent: Barber Operational Assistant

- **Stage**: M7 (phase 28) · **Tags**: backend, experimental · **Complexity**: middle · **Depends on**: T-280, T-082 (barber shell)
- **StoryPoints**: 5

## What

Operational assistant for barber in mobile: day summary (day calendar, next-up), upcoming visit hints with haircut reference — **read-only**, without schedule modification. Rescheduling — only via standard use cases with barber role and confirmation (ASSIST-BAR-02). Inventory reminders — deferred until stock-sources appear (phase 27); in this task reminders are strictly for calendar/client events.

## Sources

- AC `24-assistants.md` (ASSIST-BAR-01/02), barber-screens.md, ADR 0020

## Done

- [ ] Day summary and next-up hints from `scheduling` read-models (ASSIST-BAR-01)
- [ ] Reference hint on upcoming visits; agent does not modify schedule (ASSIST-BAR-02)
- [ ] Inventory open question recorded as dependency on phase 27

## Risks

- [ ] **Migrations**: schema change breaks existing data — migration with backfill plan
- [ ] **Domain events**: subscriptions are idempotent (ADR 0009/0016 pattern)
