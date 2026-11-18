# T-230 · Barber Self-Service Schedule

- **Stage**: M4 (phase 22) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-023 (flag), T-040
- **StoryPoints**: 5

## What

SCH-001…008: based on the permission flag, the barber edits weekly windows and one-off days off in mobile (`barber-screens.md` §5); windows strictly within `OpeningHours`; conflicts with booked slots — saving blocked, "Notify admin" (rescheduling clients is admin-only, SCH-004); second writer to `Availability` per policy; `AvailabilityChanged` event with source; change log (SCH-ADM-01…03).

## Sources

- `SCH-001…008`, `SCH-BAR/ADM-*`; `barber-screens.md` §5; scheduling README (schedule — two writers)

## Done

- [ ] Editor works with conflict blocking
- [ ] Change log in the admin panel

## Risks

- [ ] **Self-service boundaries**: barber does not move others' visits; API permissions
