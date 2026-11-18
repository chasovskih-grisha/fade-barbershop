# T-4582 · Admin Panel Analytics (Founder Dashboard, Management Actions)

- **Stage**: M3 (phase 2 — admin shell, phase 14 — analytics dashboard) · **Tags**: frontend, analytics, admin · **Complexity**: junior · **Depends on**: T-4575, T-4576
- **StoryPoints**: 3

## What

Tracking founder/admin actions in the admin panel: viewing dashboards, CRUD operations on locations/services/staff, network calendar. Non-financial data — UI analytics for admin UX only.

### Events (per T-4576)

| Event | Trigger | Properties |
|-------|---------|------------|
| `admin_dashboard_viewed` | Opening admin home page (`/`) | `widgets_visible` (array), `date_range` |
| `admin_analytics_viewed` | Opening "Analytics" section (phase 14) | `tab` (overview, revenue, occupancy, no_show, discounts, loyalty), `filters` (period, location, barber) |
| `admin_calendar_viewed` | Opening network calendar | `view_mode` (day/week), `location_filter`, `barber_filter`, `appointments_visible` |
| `admin_location_created` | Submit "Create location" → 201 | `location_code`, `location_name`, `chairs_count`, `address_city` |
| `admin_location_updated` | Saving location changes | `location_code`, `fields_changed` (array) |
| `admin_service_created` | Submit "Create service" → 201 | `service_id`, `service_name`, `category`, `base_price`, `duration_min`, `is_party_package` |
| `admin_service_updated` | Saving service changes | `service_id`, `fields_changed` (array), `price_changed` (boolean) |
| `admin_barber_created` | Submit "Add barber" → 201 | `barber_id`, `barber_name`, `location_codes` (array), `role` (barber/manager) |
| `admin_barber_updated` | Saving barber changes | `barber_id`, `fields_changed` (array), `location_assignment_changed` (boolean) |
| `admin_appointment_created` | Creating appointment by admin (walk-in in web admin) | `appointment_id`, `service_id`, `barber_id`, `location_code`, `source` (admin_walkin) |
| `admin_appointment_updated` | Changing appointment status/data by admin | `appointment_id`, `status_from`, `status_to`, `fields_changed` |
| `admin_client_viewed` | Opening client card in CRM | `client_id`, `visits_total`, `last_visit_date`, `loyalty_status` |
| `admin_client_note_added` | Adding note by admin | `client_id`, `note_length` |
| `admin_settings_changed` | Saving settings (domain, integrations, notifications) | `section` (domain, integrations, notifications, payments), `keys_changed` (array) |

### Implementation

**Admin Web (`apps/admin/src/app/`):**
- `AdminAnalyticsProvider` in `layout.tsx`
- `useAdminAnalytics()` hook in `src/lib/analytics/admin.ts`
- Layout/dashboard: `admin_dashboard_viewed` on mount
- Analytics page (phase 14): `admin_analytics_viewed` with current filters
- Calendar: `admin_calendar_viewed` on mount/filter change
- CRUD forms: submit handlers → corresponding `_created`/`_updated` events
- Client CRM: `admin_client_viewed` on row click, `admin_client_note_added` on note submit
- Settings: `admin_settings_changed` on saving any section

### Acceptance Criteria

- [ ] All 14 events fire in the admin panel
- [ ] `admin_analytics_viewed` records selected filters (period, location, barber) for dashboard usage analysis
- [ ] CRUD events have `fields_changed` to audit which fields change most frequently
- [ ] `admin_appointment_created` has `source: admin_walkin` to distinguish from barber (T-4581)
- [ ] Events contain no PII (phone, email) — only IDs and metadata

## Why

Admin UX analytics: which sections are used, which settings are changed, time on operations. Data to improve admin panel and audit admin actions.

## Sources

- admin-screens.md (admin sections)
- products.md §2 (founder admin panel)
- roadmap.md phase 14 (analytics dashboard — ANL-ADM-01…06)
- acceptance-criteria/08-analytics-dashboard.md

## Done

- [ ] `AdminAnalyticsProvider` in `apps/admin/src/app/layout.tsx`
- [ ] `useAdminAnalytics` hook in `apps/admin/src/lib/analytics/admin.ts`
- [ ] Dashboard: `admin_dashboard_viewed`
- [ ] Analytics: `admin_analytics_viewed` with filters
- [ ] Calendar: `admin_calendar_viewed`
- [ ] Locations: `admin_location_created`, `admin_location_updated`
- [ ] Services: `admin_service_created`, `admin_service_updated`
- [ ] Barbers: `admin_barber_created`, `admin_barber_updated`
- [ ] Appointments: `admin_appointment_created`, `admin_appointment_updated`
- [ ] CRM: `admin_client_viewed`, `admin_client_note_added`
- [ ] Settings: `admin_settings_changed`

## Risks

- [ ] **Low volume**: admin has low traffic, sampling not needed, but verify events do not spam Amplitude (~100 rows per day)
- [ ] **Sensitive data**: financial data in admin — do not track amount/revenue in UI events (they are in server-side billing events T-4587)
- [ ] **Role expansion**: v1 only `admin` role, later `location_manager` — add `admin_role` property if needed
