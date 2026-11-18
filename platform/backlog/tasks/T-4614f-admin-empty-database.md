# T-4614f · Admin panel on a database without locations and barbers

- **Stage**: horizontal · **Tags**: frontend, backend · **Complexity**: middle · **Depends on**: T-4614, T-4614b, T-013, T-021
- **StoryPoints**: 5

## Blocker

The founder cannot prepare the first location on an empty production database. Screens tested on seed.

- Admin login exists (`apps/admin/src/app/login/page.tsx`, `POST /admin/auth/login`), task T-013 is still `review`, not accepted.
- Locations list already has an empty state ("No locations yet", `apps/admin/src/app/locations/page.tsx`) and "Add location" button. On a database without seed, this path is not run through.
- `apps/admin/src/app/barbers/BarbersTable.tsx` on zero rows renders table header and empty body. No empty explanation. Barber creation form stands above this table (`BarbersManager.tsx`).
- Services catalog has EmptyState (`ServicesTable.tsx`: "No services yet"), also tested only on seed.
- Founder account is currently created inside `db-seed` along with demo data (T-4614b).

Shell on all routes (T-020, T-4514) is not needed for this slice.

## What

On a database where only admin exists: log in, see empty locations, barbers, and services, create the first location. Barber and service can be added after it. No demo rows.

## Done

- [ ] T-013 accepted: username + password login on an empty database lets in admin and holds session
- [ ] Locations, barbers, and services on zero rows explain that the list is empty and allow creating the first record
- [ ] First location is created without any seed rows. After it, the first barber and first service are created
- [ ] Run on a clean database after T-4614b, not on top of `seed:dev`

## Risks

- [ ] **Barber without location**: creation form should not require a location that does not exist yet; assignment to location happens after the location appears
