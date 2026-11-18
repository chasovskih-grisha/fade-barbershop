# T-4526 · Admin Service Detail Page (Info + Statistics)

- **Stage**: M3 (phase 14) · **Tags**: frontend, backend, analytics, design · **Complexity**: middle · **Depends on**: T-110, T-024, T-4419, T-4521, T-4507
- **StoryPoints**: 8

## What

Dedicated page `/admin/services/{slug}` instead of just the form in §3.2: header (name, slug, category, status), info blocks — durations (T-4419, short/long), pricing matrix by location (§3.3), barber specialization (T-4521: who performs the service); statistics from T-110 projections: booking count, revenue over period, average ticket, no-show rate, popularity by barber and location, and trend analysis. CTA buttons for "Edit", "Pricing", "Barber Matrix" (navigation to forms).

## Why

Owners need to see not just what services exist, but how well they sell: revenue generated, frequency, and who performs them. Understanding service popularity directly impacts pricing and matrix scope (T-4521). Without this page, owners are forced to manually reconcile separate reports.

## Sources

- `docs/admin-screens.md` §3 (services: form §3.2; pricing matrix §3.3), §8 (KPI)
- `backlog/tasks/T-110` (projections), T-4419 (durations), T-4521 (matrix)
- `docs/design-system.md` §Components; `docs/ux-guidelines.md` §States

## Done

- [ ] Route `/admin/services/{slug}`; header with status and category
- [ ] Durations, pricing matrix, barber specialization
- [ ] Statistics from T-110 (bookings/revenue/ticket/no-show/top) with date range filter
- [ ] Loading/empty/error states; no raw hex colors; `pnpm docs:validate` passes

## Risks

- [ ] Prices vary by location — statistics must also be segmented by location (avoid aggregating different currencies/locations without breakdown)

## Breakdown (Slices, 8 SP)

1. **T-4526a · Service Info Blocks** *(middle, 4 SP)* — header, durations, pricing matrix, specialization.
2. **T-4526b · Service Statistics** *(middle, 4 SP)* — T-110 projections, period filter, trend, barber/location breakdowns.
