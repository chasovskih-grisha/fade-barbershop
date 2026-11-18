# T-4525b · Location Details: Team, Services, and Statistics (5/13)

- **Stage**: M3 (phase 10) · **Tags**: frontend, admin · **Complexity**: middle · **Depends on**: T-4525a, T-110
- **StoryPoints**: 5

## What

Second half of the location details page: "Team" section (active location barbers with chips — source `StaffAssignment`, as per §2.1; navigation to T-4527), "Services & Prices" section (list of active services with price matrix §3.3), and "Statistics" section from T-110 projections: revenue over period, chair occupancy rate, average ticket, no-show rate, top services/top barbers. Period filter: day/week/month. KPI card pattern from T-111 (▲/▼, tooltip formulas).

This is the missing "statistics on detail page": T-111 aggregates across the entire network, while the owner wants to see the performance of each location separately (cozy on M6: two locations → comparison). Projections already exist (T-110) — the page merely subscribes to them with a location filter.

## Sources

- `docs/admin-screens.md` §8 (KPI), §2.1 (barber list), §3.3 (price matrix)
- `backlog/tasks/T-110` (projections: RevenuePerDay, ChairOccupancy, NoShowRate...)

## Done

- [ ] Team section renders active barbers with direct links
- [ ] Services & prices matrix displays correct location-specific pricing
- [ ] Statistics widget integrates T-110 projections with day/week/month filter
- [ ] KPI cards match design system styling and tooltip specifications

## Risks

- [ ] **Data loading latency**: multiple projections fetched simultaneously on location view.
