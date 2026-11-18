# T-3904 · Resource Scheduling

- **Stage**: M6 (phase 40) · **Tags**: backend, scheduling, high-risk · **Complexity**: senior · **Depends on**: T-040, T-041
- **StoryPoints**: 25

## What
Resource scheduling beyond the barber: chairs, rooms, equipment (Valencia, cabins). Multi-resource bookings (haircut = barber + chair; scalp-ritual = barber + Valencia), conflict detection, location schedule templates.

## Why
CLT-01 bottleneck — one Valencia wash basin per two chairs (catalog): slots with washing queue up for the basin. Without resource scheduling, double bookings of the wash basin are inevitable during scaling.

## Sources
- docs/resource-scheduler.md — phantom 2026-09-22: file never existed; source is accepted at task start
- `business/operations/catalog.md` §Bottleneck

## dependencies

> Slices are carved out at task start; separate subtask files are created then if needed.
## Checklist
- [ ] Resource model (chair, room, equipment) across locations
- [ ] SKU → resources binding (Valencia for slots with washing)
- [ ] Multi-resource bookings with atomic hold
- [ ] Conflict detection (double booking of resource)
- [ ] Schedule templates (week, exceptions, holidays)
