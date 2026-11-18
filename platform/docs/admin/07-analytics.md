# Admin Panel — KPI Analytics (Dashboard) Domain

## Purpose
Founder/owner dashboard with key performance indicators and charts. Read-only projection on scheduling, billing, loyalty, and discounts events. Accessible only to `admin` role (barbers do not see financial data). Provides insights for business decisions.

## Dashboard Layout
- **Filter bar**: Period (Day / Week / Month / Custom), Location (Network / CLT-01 / …), Barber (All / specific)
- **KPI Cards** (9 total): 
  1. **Revenue per day** — UAH amount, ▲/▼ vs previous period, tooltip with formula
  2. **Chair occupancy rate** — % of available minutes filled, ▲/▼, tooltip with formula
  3. **Average check** — Revenue / completed visits, ▲/▼, tooltip with formula
  4. **No-show rate** — No-show appointments / all booked, ▲/▼, tooltip with formula (ANL-ADM-02)
  5. **Cancellation rate** — Cancelled / all booked; reschedule is not a cancellation (ANL-008)
  6. **Conversion rate** — Confirmed appointments / created appointments, ▲/▼, tooltip with formula
  7. **Repeat booking rate** — Completed visits that already have a later appointment for the same client / completed visits (ANL-009)
  8. **Revenue per available chair-hour** — Period revenue / available chair-hours, UAH/hour (ANL-010)
  9. **Discount leakage** — Total discount amount + value of free visits (loyalty), in UAH and %, of total `AgreedPrice` sum (ANL-ADM-04)

- **Charts** (below KPI cards):
  - **Revenue by day** (line chart): daily revenue over selected period
  - **No-show by barber** (bar chart): no-show count per barber
  - **Discount breakdown by type** (pie chart): percentage of total discounts by type (promo, VIP, rule)
  - **Discount breakdown by location** (bar chart): total discount per location for period

- **Data refresh**: Automatic from events; "Yesterday" = full report, "Today" = current state (ANL-ADM-05)
- **Export**: CSV/Excel optional (ANL-ADM-06)

## Business Rules & Calculations
| KPI | Formula |
|-----|---------|
| **Revenue per day** | `Σ PaymentCaptured` for appointments in period |
| **Chair occupancy rate** | `(Completed appointment minutes) / (Available minutes × chairs × days)` |
| **Average check** | `Revenue / Completed visits` |
| **No-show rate** | `No-show appointments / All booked appointments` |
| **Cancellation rate** | `Cancelled appointments / All booked appointments` (`Reschedule` excluded) |
| **Conversion rate** | `Confirmed appointments / Created appointments` |
| **Repeat booking rate** | Completed visits with a later appointment for the same client at `AppointmentCompleted` / completed visits |
| **Revenue per available chair-hour** | `Σ PaymentCaptured / available chair-hours` (ANL-002 denominator in hours) |
| **Discount leakage** | `Σ AppliedDiscounts + Value of free (loyalty) visits` / `Σ AgreedPrice`, in UAH and % |

- **No-show rate**: Includes auto-fixation after 15 min (NSH-001); also manual `Mark no-show` action; rate broken down by channel (online, walk-in, phone)
- **Discount leakage**: Includes both configured discounts (promo rules, VIP) and loyalty free visits (FinalPrice = 0); does not recompute on rule changes (DSC-001)
- **Period filter**: "Day" = calendar day; "Week" = Monday-Sunday; "Month" = calendar month; "Custom" = date range picker
- **Location filter**: Networks shows aggregated data; specific location filters by `StaffAssignment`
- **Barber filter**: Filters all charts and KPI cards; no-show and conversion per barber

## API Endpoints
Analytics data is read from the NestJS API read-models. Based on the codebase:

- `GET /admin/analytics/kpi` — Returns all 9 KPI card values with period/location/barber filters and previous-period delta
- `GET /admin/analytics/charts` — Returns chart data: { type, labels, data points } for revenue-by-day, no-show-by-barber, discount-breakdown
- `GET /admin/analytics/export/csv` — CSV export of appointment-level data for selected period/filters

Response format includes:
- `kpi`: { revenue, occupancy, avgTicket, noShowRate, cancellationRate, conversion, repeatBookingRate, chairHourRevenue, discountLeakage } + deltas vs previous period
- `charts`: { revenueByDay: [{ date, revenue }], noShowByBarber: [{ barberId, count }], discountByType: [{ type, percentage }], discountByLocation: [{ locationCode, amount }] }

## Permissions
- `admin` role only (v1)
- Direct URL access without role → 403
- Barbers and location managers see only their own data (location-scoped read)
- No write access — dashboard is read-only

## Development Notes
- KPI read-models built from events: `PaymentCaptured`, `AppointmentCompleted`, `AppointmentNoShowed`, `AppliedDiscount`, `LoyaltyFreeVisitGranted`, `LoyaltyFreeVisitApplied`
- "Yesterday" vs "Today" distinction: yesterday has complete data (all payments settled, no-shows finalized); today is live state (payments may still be processing)
- Discount leakage computed from `AppliedDiscounts` snapshot on each appointment + loyalty free visit flag; not recomputed when rules change
- Charts use recharts / antd chart components; responsive layout
- Export CSV includes appointment ID, date, client, barber, service, agreed price, final price, discounts applied, payment status, no-show flag
- KPI cards show ▲/▼ delta vs previous period of same granularity (e.g., vs same day last week for "Day", vs same week last month for "Week")

## Important Edge Cases
- No-show rate includes both auto-fixed (15 min) and manually marked no-shows; double-counting prevented by status check
- Discount leakage: loyalty free visits (FinalPrice = 0) counted as discount value equal to AgreedPrice; this can make leakage > 100% if many free visits
- Conversion rate: "Created" includes walk-ins and all booking flow entries; "Confirmed" means status changed from booked/pending to confirmed
- Period "Today" may show incomplete data for revenue and no-show (transactions still processing)
- Location manager sees only their location's KPIs; admin sees network-wide with location filter option
- Barber filter on no-show chart: barbers with very few appointments may show volatile percentages

## Links to Related Documentation
- `docs/acceptance-criteria/08-analytics-dashboard.md` (ANL-ADM-01…06)
- `docs/acceptance-criteria/12-no-show-policy.md` (NSH-ADM-01, integration with no-show rate)
- `docs/acceptance-criteria/14-waitlist-autofill.md` (WTL-ADM-04 integration with analytics)
- `docs/acceptance-criteria/11-winback-campaigns.md` (WNB-ADM-04, ROI link to ANL-006)
- `docs/acceptance-criteria/05-loyalty-free-visit.md` (LYL-ADM-05, free visit impact on KPI)
- `docs/ubiquitous-language.md` (RevenuePerDay, ChairOccupancy, AvgTicket, NoShowRate, CancellationRate, ConversionRate, RepeatBookingRate, ChairHourRevenue, DiscountLeakage)
- `products.md` (ANL-ADM-01…06 — KPI access by role)
- `docs/roadmap.md` (phase 14 — analytics, enters v1; phases 16–19 — retention, after v1)
- `docs/adr/` (ADR 0006 — AgreedPrice snapshot, affects revenue calculations)