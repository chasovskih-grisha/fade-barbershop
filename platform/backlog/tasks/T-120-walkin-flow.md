# T-120 · Walk-in: FAB, quick form, on-site payment

- **Stage**: M3 (phase 15, strict requirement v1) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-082, T-093
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

## Blocking evidence

There is no walk-in surface to build on: `apps/api/src` has no walk-in controller (`grep -rln "walk-in" apps/api/src` finds only README and view comments), so `WALK-001…006`, the "Start" action and the on-site payment have no endpoints. A FAB that posts nowhere would be a stub, not the flow.
