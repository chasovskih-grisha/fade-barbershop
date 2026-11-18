# T-4836 · The studio page lists the barbers who work there

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-023, T-4610b, T-4477, T-4831, T-4850
- **StoryPoints**: 10

## What

The studio meta description says the page has the barbers. The page does not. `GET /booking/barbers/{locationId}` already returns the barbers assigned to that studio.

The barbers region lists those people: name, photo when T-4610b has one, initials when it does not, and a link to `/barbers/{slug}`. A studio with no assigned barbers omits the region. Deactivated barbers and barbers assigned only to another studio are absent. Slices: website (T-4836a), app (T-4836b).

## Why

The guest who picked LVI-01 still does not know who cuts hair there.

## Sources

- `apps/web/src/lib/api/staff.ts`
- `apps/web/src/app/locations/[code]/page.tsx` (the description that already promises barbers)
- T-4610b (photo or initials)
- T-4477 (the barber page)

## Done

- [ ] T-4836a and T-4836b are done
- [ ] The region is empty of people who do not work at this studio

## Risks

- [ ] **The endpoint wants `locationId`, not the code.** The page already has `id` on the location. It does not guess an id from `LVI-01`

## Out of scope

- The barber page’s biography, slug, and photo pipeline (T-4477, T-4413, T-4610)
- A barber’s next free slots (T-130)
