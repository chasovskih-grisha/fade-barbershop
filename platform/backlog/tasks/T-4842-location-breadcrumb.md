# T-4842 · The listing and the studio page share one breadcrumb

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, a11y · **Complexity**: junior · **Depends on**: T-4508, T-4831
- **StoryPoints**: 3

## What

The listing says «На головну». The studio page says «Усі локації». Neither says where the guest is.

Both pages use one breadcrumb: «Головна» / «Локації» / the studio name on the detail page. The current page is text, not a link. The listing’s last crumb is «Локації». The markup is a nav with an accessible name.

## Why

Two different back links teach two different maps of the same site.

## Sources

- `apps/web/src/app/locations/page.tsx`
- `apps/web/src/app/locations/[code]/LocationDetail.tsx`
- T-4482 (related-content blocks are separate)

## Done

- [ ] The listing breadcrumb is Головна → Локації, and Локації is not a link
- [ ] The studio breadcrumb adds the studio name as the current item
- [ ] The old «На головну» and «Усі локації» text links are gone
- [ ] A test covers both pages

## Risks

- [ ] **A crumb that wraps into the hero.** On a narrow viewport the crumb is one line that can wrap, above the title, and does not overlay the photo

## Out of scope

- Related-page blocks and the sitemap (T-4482)
- The app back control (T-4844). The app uses a back affordance, not this breadcrumb
