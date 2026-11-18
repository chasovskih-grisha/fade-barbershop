# T-4861a · Slice: studios on the website barber profile

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4861
- **StoryPoints**: 5

## What

Render the studios region on `/barbers/{slug}` from the assignments T-4852 already loaded. Each row links to that location’s public page.

## Why

The profile is where the guest decides where to meet this person.

## Sources

- T-4861
- `apps/web/src/app/barbers/[slug]/BarberDetailContent.tsx`

## Done

- [ ] Two assignments render two links
- [ ] The href is `/locations/{code}`
- [ ] No assignment omits the heading
- [ ] A test covers both

## Risks

- [ ] **Linking a location the directory did not load.** The region only lists assignments returned with the barber

## Out of scope

- The app region (T-4861b)
