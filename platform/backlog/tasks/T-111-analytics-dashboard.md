# T-111 · Analytics Dashboard

- **Stage**: M3 (phase 8) · **Tags**: admin, analytics · **Complexity**: senior · **Depends on**: M2 completed, T-110
- **StoryPoints**: 8

## What

Comprehensive analytics dashboard for founders and location managers in the admin panel (`admin-screens.md` §10):
- Key metrics: Revenue, occupancy rate, average check, new vs returning clients, no-show rate, cancellation rate, labor efficiency.
- Date range filtering (today, week, month, custom) and location filtering (network total vs individual shop).
- Charts and breakdowns: hourly revenue heatmap, popular services, barber performance comparison.
- Export to CSV/Excel for financial reporting.

## Why

Data-driven decision making for capacity planning, pricing, and staff performance evaluation.

## Sources

- `admin-screens.md` §10, `docs/slo.md`, `docs/business/financials`

## Done

- [ ] Backend aggregation queries and API endpoints for analytics metrics
- [ ] Admin dashboard UI with charts (revenue, occupancy, services, barbers)
- [ ] Location and date range filters
- [ ] CSV/Excel export functionality
- [ ] Unit & integration tests for metric calculations
