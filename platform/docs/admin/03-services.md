# Admin Panel — Services & Pricing Domain

## Purpose
Management of services offered by the barbershop, including categories, duration, and per-location pricing matrix. Also handles SEO/FQA metadata per service.

## Pages & Features
- **List Services** (`/services`)
  - Displays table with columns: Name, Category, Duration (min), Prices (chips per location: "CLT-01 · 400 ₴"), Status (badge), Actions (Edit, Prices, Deactivate)
  - Filter bar: Category (select), Status (All / Active / Inactive)
  - Empty state: "Services none yet"

- **Create/Edit Service** (MNG-ADM-10)
  - **Fields**: Name (required, text), Description (optional, textarea), Category (required, select: haircut, shave, beard, care), Duration (required, minutes, 10–240), Active (toggle)
  - **SEO & FAQ section** (phase 26, SRV-ADM-01):
    - Slug (text, auto-generated from name; changing edited slug → 301 redirect from old)
    - `<title>` / meta description (text, template with auto-substitution or manual override)
    - FAQ (3–6 question-answer pairs, draggable order, renders with FAQPage structured data)
  - **Deactivate** → confirmation: "Service will not show in bookings on any location." Service page `/services/{slug}` returns 410

- **Pricing Matrix** (MNG-ADM-11…14, "Prices" on service)
  - **Layout**: Table: Location | Price (UAH, numeric inline edit) | Available (toggle — enabled/disabled for specific location, MNG-ADM-12)
  - **One service, different prices on different locations** — visible on single screen (`MNG-ADM-11`)
  - **Price change** → confirm-banner: "Change applies only to new appointments. N appointments with old price will not change." (`MNG-ADM-13`)
  - **Price history** — panel on same screen: date, admin, "400 ₴ → 450 ₴ (CLT-01)" (`MNG-ADM-14`)
  - **Per-location availability** — toggle enables/disables the service at that specific location

## API Endpoints
- Services CRUD and pricing are handled by the NestJS API, but no dedicated admin service controllers were found in the current code snapshot. The booking API (`/booking/services/:locationId`) and public API (`/booking`) serve service data. Services and pricing are typically managed through the admin panel forms described above, with data persisted via application use cases (create-service, update-service) not yet exposed as REST endpoints in the current implementation snapshot.

- Based on the DTOs found in the codebase:
  - `ServiceDto`: id, name, duration (minutes), price (local currency units)
  - `CreateBookingDto`: barberId?, locationId, dayOfWeek, start, end, serviceDuration?
  - Pricing matrix and per-location availability likely managed through `update-location` handler which includes `chairs` and `hours`, but service-specific pricing may be in a separate domain not yet implemented in the API snapshot.

## DTOs (from codebase)
- `ServiceDto`: id, name, duration (number minutes), price (number in local currency)
- `CreateBookingDto`: barberId?, locationId, dayOfWeek, start (HH:mm), end (HH:mm), serviceDuration? (default 30)

## Business Rules
- Duration: 10–240 minutes, required
- Category required from enum: haircut, shave, beard, care (or similar)
- SEO slug auto-generated from name; changing edited slug → 301 redirect from old slug
- Service deactivation removes from booking flows; existing appointments keep their price snapshot (AgreedPrice — frozen at booking time, ADR 0006)
- Per-location pricing: one service can have different prices at different locations; each price has availability toggle
- Price change applies only to new appointments; old appointments keep their snapshot via AgreedPrice

## Permissions
- `admin` role only (v1)
- Direct URL access without role → 403
- Prices are UAH; locale-specific availability per location

## Development Notes
- Category enum likely: haircut, shave, beard, care (matching ubiquitous-language terms)
- Duration input: numeric, 10–240, step 1 or 5 minutes
- Slug: auto-generated from name on create; editable with warning on change → 301 redirect logic
- Price history stored per (service, location, date, admin) for audit trail
- Per-location availability toggle stored as part of service-location relationship, not in ServiceDto itself

## Important Edge Cases
- Changing service slug triggers 301 redirect from old slug (SEO); old URL still works but redirects
- Deactivating a service: existing appointments retain their AgreedPrice snapshot; service hidden from new bookings
- Price change banner references count of appointments with old price — this count is computed from snapshots
- FAQ items: draggable order; rendered on public `/services/{slug}` page with FAQPage structured data
- Per-location availability: service can be enabled/disabled independently at each location; disabled service not shown in that location's booking flow

Links to related documentation:
- `docs/acceptance-criteria/04-admin-management.md` (MNG-ADM-10…14, SRV-ADM-01)
- `docs/ubiquitous-language.md` (Service, AgreedPrice, FinalPrice, Duration, Category)
- `products.md` (§2 — pricing matrix, catalogue)
- `docs/roadmap.md` (phase 26 — SEO service pages)
- `docs/adr/` (ADR 0006 — AgreedPrice snapshot at booking)