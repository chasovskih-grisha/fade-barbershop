# T-105 · Network: Second Location (Data, Prices, Manager Role)

- **Stage**: M6 (phase 9 — per business trigger: second point signed) · **Tags**: backend · **Complexity**: middle · **Depends on**: M3 (v1 launched)
- **StoryPoints**: 5

## What

- Creation of CLT-02 in admin: location, chairs, hours, services with **location-based prices** (model `MNG-ADM-11` already supports); enable SRV-002 — service page variants by location.
- **Override of deposit policy by location** (PAY-ADM-09 — field appears on location page; by barber — rejected).
- `location_manager` role in `identity`: `Role` extension, assignment scope, screens per access matrix §16 (staff, prices, campaigns, settings — not delegated).
- PRRO/cash register of the new point (operationally — T-131 semantics for CLT-02).

## Why

Second location is the first test of unit economics scaling (goal of the entire project); delegation removes the founder's admin bottleneck.

## Sources

- roadmap (phase 9 — delegation with second location); PAY-ADM-09 (override by location); `admin-screens.md` §16; SRV-002

Index — `todo` (2026-10-02). Closing 2026-09-14 was planning: criteria below open, CLT-02 none.

## Done

- [ ] Second location accepts bookings and money on its own register
- [ ] Manager manages their point without access to network settings

## Blocking evidence

The row is an operations change, not code: creating CLT-02 needs the production database and the PRRO cash register of the new point (T-131), and the `location_manager` role needs the identity migration to run against real users. Nothing in this workspace can create a second studio, so the row stays un-claimed.
