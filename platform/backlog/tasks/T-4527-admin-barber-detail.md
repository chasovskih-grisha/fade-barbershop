# T-4527 · Barber Detail Page (Profile + Statistics)

- **Stage**: M3 (phase 14) · **Tags**: frontend, backend, analytics, design · **Complexity**: middle · **Depends on**: T-110, T-023, T-4521, T-4415, T-4507
- **StoryPoints**: 8

## What

Dedicated page `/admin/barbers/{id}`: header (name, photo, location, status, role), profile blocks — schedule (T-4415), service matrix (T-4521), deactivation/reasons; statistics from T-110 projections: chair utilization, revenue over period, average ticket, client no-show rate, visit count, opponent status. Expansion «Visits» (completed list) and «Peak Hours». CTA «Edit», «Schedule», «Service Matrix».

## Why

Owners need to evaluate every barber's performance: utilization, revenue, slot no-shows. Currently this is only visible in aggregated KPI (T-111) or not at all. The admin barber page differs from the barber self-dashboard (T-3202, M6) — the latter is reporting for the barber, whereas this is an owner review.

## Sources

- `docs/admin-screens.md` §2 (staff, form/schedule), §8 (KPI: by barber)
- `backlog/tasks/T-110` (projections), `T-4521` (matrix), `T-4415` (schedule)
- `docs/design-system.md` §Components; `docs/ux-guidelines.md` §States

## Done

- [ ] Route `/admin/barbers/{id}`; status header
- [ ] Schedule, service matrix, deactivation
- [ ] Statistics from T-110 (utilization/revenue/ticket/no-show), period filter
- [ ] Loading/empty/error states; no hex; `pnpm docs:validate` green

## Risks

- [ ] Overlaps part of T-3202 (barber self-dashboard, M6) — clear separation: admin overview here, self-service there.

## Breakdown (slices, 8 SP)

1. **T-4527a · Barber Profile & Configuration** *(middle, 4 SP)* — header, schedule, matrix, deactivation.
2. **T-4527b · Barber Statistics** *(middle, 4 SP)* — T-110 projections, period, visits, peak hours.
