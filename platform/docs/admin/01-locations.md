# Admin Panel — Locations Domain

## Purpose
Management of barbershop network locations (CLT-01, CLT-02, etc.). Handles creation, editing, activation/deactivation, and scheduling configuration of locations.

## Pages & Features
- **List Locations** (`/locations`)
  - Displays table with columns: ID (code), Name, Address, Hours (short form), Chairs (count), Status (badge), Actions (Edit, Activate/Deactivate)
  - Empty state: "Locations none yet — create first"
  - Create/Edit form with two sections:
    - **Location Data**: Code (uppercase, unique, required), Name (required), Address (required), Coordinates (lat/lng, required for website map), Phone/Email (optional, format validated), Active (toggle)
    - **Hours Editor**: 7 rows (Mon-Sun), each: checkbox "Closed" + time inputs "Open" / "Close" (15-min steps)
    - Validation: "Open" < "Close"; row error if "Closed" unselected without time inputs
    - Persistence: Hours immediately visible on website/app after save

- **Create/Edit Location** (MNG-ADM-01, MNG-ADM-03)
  - - Form validated server-side: code unique, phone/email format, hours open<close
  - - Chair management: per-location list, active toggle
  - - Hours persist to website immediately

- **Update Location Active** (MNG-ADM-02)
  - - Confirmation dialog: "Location will become unavailable for new bookings. N existing appointments not cancelled."
  - - Buttons: "Deactivate" / "Cancel"

- **Chairs** (MNG-ADM-04)
  - - Sub-section on location page: list of chairs (number, optional name, active toggle)
  - - Inactive chairs excluded from scheduling (marked "Inactive")
  - - Cross-check: saving schedule against location OpeningHours warns if barber hours exceed location hours (MNG-ADM-09)

## API Endpoints
- `GET /admin/locations` — List all locations
- `GET /admin/locations/:id` — Get location by ID
- `POST /admin/locations` — Create new location
- `PATCH /admin/locations/:id` — Update location

## DTOs
- `CreateLocationDto`: code, name, address, lat, lng, phone?, email?, hours[]
- `UpdateLocationDto`: name?, address?, lat?, lng?, phone?, email?, active?, hours?, chairs?
- `LocationDto`: id, code, name, address, lat, lng, phone, email, active, chairs, hours

## Entities & Values
| Entity | Fields |
|--------|--------|
| **Location** | id, code (unique, uppercase), name, address, lat/lng, phone, email, active, chairs, hours |
| **Chair** | number, name (optional), active |

## Business Rules
- Code must be uppercase and unique across all locations
- Deactivating a location with active appointments shows confirmation referencing count
- Hours schedule cross-checked against location OpeningHours on save
- Chair active status excludes from scheduling

## Permissions
- `admin` role only (v1)
- Direct URL access without role → 403
- Location scoping via StaffAssignment filters data by location

API Integration
- All endpoints require admin session cookie (`/admin/auth/me`)
- Responses use standard JSON DTOs
- Error responses: banner with "Retry" button (UI pattern)

## Important Edge Cases
- Location with active appointments cannot be deactivated without confirmation referencing appointment count
- Saving hours editor blocks if barber schedule exceeds location OpeningHours
- Location code uniqueness enforced server-side
- Coordinates required for website map integration

## Development Notes
- Hours editor uses 15-min steps, 7 days × 96 slots max
- Chair numbering is per-location, not global
- Location code uniqueness checked on server after client send
- Coordinates tie to website map (separate frontend component)

Links to related documentation:
- `docs/acceptance-criteria/04-admin-management.md` (MNG-ADM-*)
- `products.md` (§2, §3 — pricing matrix)
- `docs/architecture.md` (overall architecture)