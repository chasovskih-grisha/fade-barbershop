# T-4415 · Staff Weekly Schedule Editor

- **Stage**: M1 (phase 2) · **Tags**: frontend, backend · **Complexity**: middle · **Depends on**: T-023, T-040
- **StoryPoints**: 5

## What

Weekly grid editor for barber schedules in the admin panel (Monday–Sunday × intervals): quick addition/moving of work intervals via mouse, conflict validation with existing bookings, bulk week copying, saving via `ScheduleChanged` event (idempotent, ADR 0009/0016).

## Why

T-023 provides data, T-082 provides the barber calendar, but a convenient weekly planning screen is missing; operator CLT-01 currently edits schedules via "clicks through the assembly".

## Sources

- admin-screens.md §3–5; scheduling README; MNG-ADM-05…09

## Done

- [x] Weekly editor works (Add/move/duplicate week)
- [x] Booking conflicts trigger a warning rather than "silent" overwriting
- [x] Unit tests for interval moving and event emission

## Risks

- [ ] **Schedule vs booking**: modified time slot without client consent — manual confirmation or auto-notification
