# T-044 · "Father + son" party (sequential/parallel)

- **Stage**: M1 (phase 4) · **Tags**: backend · **Complexity**: senior · **Dependencies**: T-040, T-041
- **StoryPoints**: 8

## What

`AppointmentParty` (ADR 0011): screen 1b (modes with ⚑ "will occupy entire hall"), multi-select of two different barbers (PARTY-004), slots (sequential 90 min / parallel two chairs shared start), two `PartyLeg` with son's name (PARTY-009), completion by legs. One transaction, one `AgreedPrice`.

## Requirement sources

- `PARTY-001…011` + surfaces; **ADR 0011**; `booking-flow.md` screens 1b/2/3/4/5

## Done

- [x] API validates active assigned barbers, their availability windows, and location opening hours
- [x] API snapshots the active location price and atomically saves the party plus reservation rows
- [x] Parallel reservations enforce chair capacity and reject barber booking conflicts
- [x] Domain mode rules and API/repository tests cover sequential and parallel slot constraints
- [x] PARTY-003…005 validations covered by tests

Admin web flow of both modes not included in this task: remains in T-040/T-041.

## Risks

- [x] **Migrations**: schema change breaks existing data — party data live in JSON columns of existing `AppointmentParty` model (baseline `0_init`), separate migration with backfill not needed
- [ ] **Domain events**: subscriptions idempotent (pattern ADR 0009/0016)

## Current slice

API route: `POST /admin/appointment-parties` (admin session required). Sequential mode reserves one 90-minute booking; parallel mode reserves father 50 minutes and son 45 minutes with shared start. Price and booking rows saved in same serializable transaction, atomically with chair invariant (see T-040c): any leg conflict rolls back entire party (`appointment-party/e2e/appointment-party-race.e2e.spec.ts`).

PARTY-003…005 validations coverage (2026-09-25): PARTY-003 — mode and barbers (`create-appointment-party.use-case.spec.ts`, `create-appointment-party-errors.spec.ts`); PARTY-004 — two legs, father→son order, barber match to mode, atomic persist + leg conflict (`use-case.spec.ts`, `prisma-appointment-party.repository.spec.ts`); PARTY-005 — durations 90/50+45, parallel shared start, active chairs (`use-case.spec.ts`, `prisma-appointment-party.repository.spec.ts`, race e2e). The admin web booking flow remains open under T-040/T-041.

## Open decision

- ADR 0011 sets sequential party-slot as 90 min, while legs "son 45 + father 50" in sequential order sum to 95 min. Until product rule confirmed system holds total slot by accepted ADR value (90 min); individual sequential legs schedule not yet modeled.
