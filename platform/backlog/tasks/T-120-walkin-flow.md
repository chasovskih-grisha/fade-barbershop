# T-120 · Walk-in: FAB, quick form, on-site payment

- **Stage**: M3 (phase 15, strict requirement v1) · **Tags**: backend, frontend · **Complexity**: middle · **Depends on**: T-082, T-093
- **StoryPoints**: 5

## What

WALK-001…006: FAB "Walk-in" (disabled when 2/2 chairs taken), quick form ~10s (service, client by phone or new — WALK-003, time "now", slots), creation in `booked` with active "Start" (WALK-BAR-02), visit source for analytics (WALK-ADM-03), on-site payment by barber (WALK-BAR-03 → PAY-ONS).

## Sources

- `WALK-001…006`, `WALK-BAR-01…03`, `WALK-ADM-01…03`; `barber-screens.md` §1; **PARTY-BAR-03** (walk-in parties)

## Done

- [ ] Live booking in ~10 seconds works in barber app
- [ ] Walk-in visits in calendar and analytics with source

## Risks

- [ ] **Speed ~10s**: field by field tested on device, not emulator
- [ ] **Conflict with online booking**: same validator as T-040
