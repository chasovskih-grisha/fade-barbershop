# T-4836a · Slice: barbers on the website studio page

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4836
- **StoryPoints**: 5

## What

Add the barbers region to `/locations/{code}` in the slot T-4831 reserved. Each person links to the existing barber page. The photo uses the public card rule from T-4610b.

## Why

The website is the page whose description already mentions the barbers.

## Sources

- T-4836
- `apps/web/src/lib/api/staff.ts`

## Done

- [ ] Only barbers returned for this `locationId` render
- [ ] Each row links to `/barbers/{slug}`
- [ ] A missing photo uses initials, not a broken image
- [ ] An empty assignment list omits the heading
- [ ] A test covers one barber, a missing photo, and an empty list

## Risks

- [ ] **A loading barber list shifting the gallery.** The region reserves no empty box; it appears when the list resolves, under the contacts region

## Out of scope

- The app list (T-4836b)
