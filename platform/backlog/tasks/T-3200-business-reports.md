# T-3200 · Business Reports

- **Stage**: M6 (phase 40) · **Tags**: backend, analytics · **Complexity**: senior · **Depends on**: T-110, T-111
- **StoryPoints**: 20

## What
Reports: revenue/bookings/utilization by location/barber/service/period; no-show rate; funnel conversion; average check; LTV. Filters, CSV/PDF/Excel export, scheduled email distribution, caching.

## Why
Admins/owners make decisions based on data. Automated reports save time. Export for accounting.

## Sources
- ADR 0009/0016 (events from outbox — projection source; README analytics)
- `analytics/README.md`

## dependencies
> Slices are defined at task start; individual subtask files are created then if needed.
