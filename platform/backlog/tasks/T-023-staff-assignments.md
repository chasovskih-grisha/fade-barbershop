# T-023 · Staff: Barbers, Assignments, Schedules

- **Stage**: M1 (phase 2) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-020, T-021
- **StoryPoints**: 5

## What

Barber = `User` with `barber` role (phone unique, no password — OTP). Form, location assignments (`StaffAssignment`), weekly `Availability` editor (windows within `OpeningHours`, no overlaps, max 2 windows/day, conflicts with booked appointments), deactivation (hidden from website and slots). Flag "manage schedule myself" (used by phase 22).

## Why

`Availability` is the core of slot validation; gate `MNG-ADM-05…09`.

## Sources

- `MNG-ADM-05…09`; `admin-screens.md` §2; scheduling README (`Availability`, two writers — phase 22)

## Done

- [x] Barbers, assignments, schedules CRUD
- [x] Deactivated barber disappears from booking (MNG-ADM-05)

## Progress

- 2026-09-23: Added protected APIs and admin UI for barbers, assignments, and weekly schedules. Server checks OpeningHours bounds, up to two windows per day, overlaps, and conflicts with existing bookings; deactivated barbers are excluded from lists and booking slots. E2E tests passing; live browser smoke confirmed login, assignment/removal, and schedule saving; review needed.

## Risks

- [ ] **Migrations**: schema changes break existing data — migration with backfill plan
- [ ] **Domain events**: subscriptions are idempotent (ADR 0009/0016 pattern)
