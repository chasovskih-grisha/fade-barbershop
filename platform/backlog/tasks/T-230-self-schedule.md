# T-230 · Barber Self-Service Schedule

- **Stage**: M4 (phase 22) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-023 (flag), T-040
- **StoryPoints**: 5

## What

SCH-001…008: based on the permission flag, the barber edits weekly windows and one-off days off in mobile (`barber-screens.md` §5); windows strictly within `OpeningHours`; conflicts with booked slots — saving blocked, "Notify admin" (rescheduling clients is admin-only, SCH-004); second writer to `Availability` per policy; `AvailabilityChanged` event with source; change log (SCH-ADM-01…03).

## Sources

- `SCH-001…008`, `SCH-BAR/ADM-*`; `barber-screens.md` §5; scheduling README (schedule — two writers)

## Done

- [x] Editor works with conflict blocking
- [x] Change log in the admin panel

## Risks

- [x] **Self-service boundaries**: barber does not move others' visits; API permissions

## Current Slice (2026-11-24)

Backend is wired end to end: `GET/PUT /barber/schedule/:locationId`, history and
unavailability routes use the mobile client session and the `selfSchedule` flag;
`EditOwnScheduleHandler` blocks a save when a future visit falls outside the new
windows and returns the conflict list. `SetAvailabilityHandler` and the barber
route write a durable `ScheduleChangeLog` (source `admin`/`barber`), exposed at
`GET /admin/schedule/change-log`. Barber unavailability continues through the
existing T-4616a interval/conflict path. The barber mobile screens are not part
of this backend slice.
