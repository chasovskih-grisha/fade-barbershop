# T-4863 · The barber listing and the profile share one breadcrumb

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, a11y · **Complexity**: junior · **Depends on**: T-4508, T-4860
- **StoryPoints**: 3

## What

The listing says "Home". The profile says "All barbers". The structured breadcrumb on the profile is a script tag, not the visible trail.

Both pages use one visible breadcrumb: "Home" / "Barbers" / the person’s name on the profile. The current crumb is text, not a link. The markup is a nav with an accessible name.

## Why

Two back links teach two maps of the same directory.

## Sources

- `apps/web/src/app/barbers/page.tsx`
- `apps/web/src/app/barbers/[slug]/BarberDetailContent.tsx`
- T-4477a (the schema breadcrumb stays there)

## Done

- [ ] The listing crumb is Home → Barbers, and Barbers is not a link
- [ ] The profile adds the person’s name as the current item
- [ ] The old back-link sentences are gone
- [ ] A test covers both pages

## Risks

- [ ] **A long name wrapping over the portrait.** The crumb is one block above the title and does not overlay the photo

## Out of scope

- Schema.org BreadcrumbList (T-4477a)
- The app back control (T-4867)
