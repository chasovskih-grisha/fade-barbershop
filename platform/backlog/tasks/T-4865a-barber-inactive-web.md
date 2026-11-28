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

## Implementation plan

Paths:
- apps/web/src/app/barbers/[slug]/BarberInactive.tsx
- apps/web/src/app/barbers/__tests__/barber-inactive.test.tsx

Checks:
- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/barbers/__tests__/barber-inactive.test.tsx`

## Done

- [x] The directory does not render an inactive barber
- [x] A direct open has no `/booking` link
- [x] A test covers the list and the direct open

## Risks

- [ ] **Treating unknown as inactive.** An unknown slug stays `notFound()` (T-4477a). Inactive is a known person with the flag

## Out of scope

- The app screen (T-4865b)

## QA

- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/barbers/__tests__/barber-inactive.test.tsx` exit 0
