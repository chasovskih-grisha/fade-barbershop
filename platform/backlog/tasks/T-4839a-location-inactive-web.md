# T-4839a · Slice: the inactive studio page on the website

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4839
- **StoryPoints**: 3

## What

Remove the book link from `LocationInactive`. Keep the explanation and the link to `/locations`. The page stays noindex, as it is now.

## Why

The misleading control is on this component.

## Sources

- T-4839
- `apps/web/src/app/locations/[code]/LocationInactive.tsx`

## Done

- [x] The inactive page has no `/booking` link
- [x] «Обрати іншу локацію» remains and points at `/locations`
- [x] A test asserts the book link is absent and the list link is present

## Risks

- [ ] **The alert looking like the whole site is closed.** The title still includes the studio name

## Out of scope

- The app screen (T-4839b)
