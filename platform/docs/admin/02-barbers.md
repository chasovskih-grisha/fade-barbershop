# Admin Panel — Barbers/Staff Domain

## Purpose
Management of barbers/staff members. Handles creation, editing, activation/deactivation, and schedule editor (availability windows per day of week). Barber is the same `User` entity with role `barber` (ADR 0005), authenticated via phone+OTP on mobile, session cookie on web.

## Pages & Features
- **List Barbers** (`/barbers`)
  - Displays table with columns: ID, Name, Phone, Locations (chips: CLT-01), Schedule (short form: "Mon-Fri 10:00-19:00"), Status (badge), Actions (Edit, Schedule, Activate/Deactivate)
  - Empty state: "Barbers none yet"
  - Filter bar: Location ("All" / CLT-01 / …), Status ("All" / Active / Deactivated)

- **Create/Edit Barber** (MNG-ADM-05)
  - **Fields**: Name (required, text), Phone (required, `+380…`, unique, same `User`; no password — OTP, ADR 0005), Locations (checkbox list, ≥ 1, can be multiple), Active (toggle)
  - **Validation**: phone unique (server-side), ≥ 1 location selected
  - **Deactivation** → confirmation: "Barber will not receive new appointments. N existing appointments remain." (`MNG-ADM-05`)

- **Schedule Editor** (MNG-ADM-07…09)
  - **Layout**: 7 rows (Mon-Sun), each: toggle "Closed" or time windows ("from"–"to") + delete window button
  - **Add window**: max 2 windows per day, 15-min step
  - **Validation**: windows must not overlap within same day (row error)
  - **On save** (conflict detection, MNG-ADM-08):
    - Modal "Schedule conflicts" lists affected appointments (client, time, service)
    - Per-affected appointment: choice "Reschedule" (pick new slot) or "Leave as is"
    - **Saving blocked** until all conflicts resolved
  - **Cross-check against location OpeningHours** (MNG-ADM-09):
    - If barber schedule exceeds location OpeningHours → yellow warning banner: "Barber hours exceed location opening hours"
  - **Self-service** (phase 22+): if barber delegated schedule (`SCH-001`), same `Availability` aggregate edited by barber from mobile with stricter constraints (within `OpeningHours`, no moving clients on conflict); admin editor remains senior source

- **Activate/Deactivate Barber**
  - Confirmation dialog with reference to existing appointment count
  - Deactivated barber excluded from new bookings; existing appointments remain (no automatic change)

## API Endpoints
- `GET /admin/barbers` — List all barbers
- `GET /admin/barbers/:id` — Get barber by ID
- `POST /admin/barbers` — Create new barber
- `PATCH /admin/barbers/:id` — Update barber (name, selfSchedule)
- `POST /admin/barbers/:id/deactivate` — Deactivate barber
- `POST /admin/barbers/:id/activate` — Activate barber

## DTOs
- `CreateBarberDto`: name, phone
- `UpdateBarberDto`: name?, selfSchedule?
- `BarberDto`: id, phone, name, active, selfSchedule

## Entities & Values
| Entity | Fields |
|--------|--------|
| **User** (role: barber) | id, phone (ValueObject), name, active, selfSchedule, role, locations (StaffAssignment) |
| **StaffAssignment** | barberId, locationId (links barber to location) |

## Business Rules
- Barber phone must be unique across all Users (client + barber + admin)
- Barber has no password — login via phone+OTP (mobile) or username+password (admin only, T-013)
- ≥ 1 location must be assigned to a barber
- Deactivated barber excluded from new booking flows; existing appointments remain unaffected
- Barber schedule cross-checked against location OpeningHours (yellow warning, not hard error)
- Self-service schedule (`SCH-001`) has stricter constraints: within OpeningHours, no client relocation on conflict

API Integration
- All endpoints require admin session cookie (`/admin/auth/me`)
- Barber creation uses same `User` aggregate as identity service
- Schedule save triggers conflict resolution modal; API validates non-overlapping windows
- Deactivate/Activate returns `{ id: string }`; existing appointments preserved

## Important Edge Cases
- Barber with no assigned locations cannot be saved
- Schedule conflicts block save until resolved; affected appointments listed with client, time, service
- Barber hours exceeding location hours → yellow warning banner (not preventing save)
- Self-service schedule aggregates share same `Availability` entity; concurrent edits audited via `AvailabilityChanged` event
- Barber phone uniqueness enforced across entire User table (not just barbers)

## Development Notes
- Schedule editor uses 15-min steps, max 2 windows per day × 7 days = 14 windows max
- Barber→location assignment via `StaffAssignment`; data filtered by location in UI
- Deactivated barber hidden from new booking lists; existing bookings remain visible
- `selfSchedule` flag on barber controls whether barber can edit own schedule from mobile
- Conflict resolution UI: per-appointment choice "Reschedule" / "Leave as is"

Links to related documentation:
- `docs/acceptance-criteria/04-admin-management.md` (MNG-ADM-05…09)
- `docs/ubiquitous-language.md` (User, Barber, PhoneNumber, Session, Role)
- `docs/roadmap.md` (phases 22 — self-service, SCH-001)
- `products.md` (role matrix × screens)
- `docs/adr/` (ADR 0005 — single User; ADR 0011 — Availability aggregate)