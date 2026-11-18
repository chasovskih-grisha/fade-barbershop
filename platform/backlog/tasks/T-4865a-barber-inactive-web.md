# T-4865a · Slice: an inactive barber on the website

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4865
- **StoryPoints**: 3

## What

The directory filters `active: false`. The profile route, given that flag, renders the explanation and the link to `/barbers`, with no book control. The page is noindex.

## Why

The website is where the old link still works.

## Sources

- T-4865
- `apps/web/src/app/barbers/[slug]/page.tsx`

## Done

- [ ] The directory does not render an inactive barber
- [ ] A direct open has no `/booking` link
- [ ] A test covers the list and the direct open

## Risks

- [ ] **Treating unknown as inactive.** An unknown slug stays `notFound()` (T-4477a). Inactive is a known person with the flag

## Out of scope

- The app screen (T-4865b)
