# T-4488 · Timezones (IANA) + DST

- **Stage**: M6 (phase 40) · **Tags**: backend, scheduling, high-risk · **Complexity**: middle · **Depends on**: T-040, T-105
- **StoryPoints**: 8

## What

Schedule and slots in location timezone (IANA), all times stored in UTC with zone transition; DST does not create gaps/duplicates in the slot grid; client timezone change — correct viewing. Migration of existing time data without regression for current zone.

## Why

Network across different zones + DST is a classic source of slot/reminder confusion; visit price bug unnoticed until now.

## Sources

- scheduling README; booking-flow.md; T-040 (slots), T-105 (network, zones)

## Done

- [ ] All time operations via location ZoneId; slot generation DST-resilient
- [ ] Client zone transition correct (reminders in client's current zone?)
- [ ] Tests: 2 zones, season transition, edge values

## Risks

- [ ] **Slot regression**: changing time model — locking T-041 tests without failures (run on migration * Batch)
