# T-4526b · Service detail statistics (4/8)

- **Stage**: M3 (phase 14) · **Tags**: frontend, backend, analytics · **Complexity**: middle · **Depends on**: T-110, T-4526a
- **StoryPoints**: 4

## What
Service statistics block from T-110 projections: bookings per period, revenue, average check, no-show rate, daily/weekly trend; breakdown by barbers (who performs most often) and by locations (where it sells best). Period filter: day/week/month. KPI cards with T-111 pattern (▲/▼, tooltip formulas). Empty data — "after first bookings".

## Why
Key value of the service page is answering "should this service stay in the catalog and at what price". This directly impacts pricing and matrix decisions (T-4521).

## Sources
- `docs/admin-screens.md` §8 (KPI), §3 (breakdowns)
- `backlog/tasks/T-110` (projections); `T-111` (card pattern)

## Done
- [ ] Statistics from T-110 filtered by service; breakdowns by barbers/locations
- [ ] Trend and empty state; unit test on service aggregation
- [ ] e2e; `pnpm docs:validate` green
