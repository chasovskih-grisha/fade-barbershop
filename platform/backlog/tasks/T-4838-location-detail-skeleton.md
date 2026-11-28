# T-4838 · The studio skeleton, the error, and the inactive page share one width

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4513, T-4831
- **StoryPoints**: 3

## What

`locations/[code]/loading.tsx` is a narrow column with two bars and two rectangles. The error branch in `page.tsx` and `LocationInactive` use `max-w-3xl`. After T-4831 the loaded page is the listing width.

Loading, error, and the inactive shell use that same width and the same hero block as the visit plan. The skeleton does not include a fake map or a fake price. This task does not rewrite the inactive copy (T-4839).

## Why

Opening LVI-01 currently flashes a narrow skeleton and then, if the layout changes, a wider page.

## Sources

- `apps/web/src/app/locations/[code]/loading.tsx`
- `apps/web/src/app/locations/[code]/page.tsx`
- T-4513

## Done

- [ ] Loading, error, and inactive shells share the visit-plan max width
- [ ] The skeleton includes a hero block and two section blocks, not the old two-card grid only
- [ ] A test renders the loading file and asserts the shared width class

## Risks

- [ ] **Copying the full visit plan into the skeleton.** The skeleton is the hero and two blocks. It does not duplicate every section

## Out of scope

- The inactive copy and the book button on it (T-4839)
- The listing skeleton (T-4825)
