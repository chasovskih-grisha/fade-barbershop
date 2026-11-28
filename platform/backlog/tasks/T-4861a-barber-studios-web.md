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

## Implementation plan

Paths:
- apps/web/src/lib/api/studio-directory.ts
- apps/web/src/lib/api/staff.ts
- apps/web/src/app/barbers/barbers-filter.ts
- apps/web/src/app/barbers/BarbersClient.tsx
- apps/web/src/app/barbers/[slug]/BarberDetailContent.tsx
- apps/web/src/lib/api/__tests__/barbers-by-studio.test.ts
- apps/web/src/app/barbers/__tests__/barber-studios.test.tsx

Checks:
- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/lib/api/__tests__/barbers-by-studio.test.ts`
- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/barbers/__tests__/barber-studios.test.tsx`

## Done

- [x] Two assignments render two links
- [x] The href is `/locations/{code}`
- [x] No assignment omits the heading
- [x] A test covers both

## Risks

- [ ] **Linking a location the directory did not load.** The region only lists assignments returned with the barber

## Out of scope

- The app region (T-4861b)

## Implementation notes

- apps/web/src/app/barbers/[slug]/BarberDetailContent.tsx
- apps/web/src/app/barbers/__tests__/barber-studio-groups.test.tsx
- apps/web/src/app/barbers/__tests__/barber-studios.test.tsx
- apps/web/src/lib/api/__tests__/barbers-by-studio.test.ts
- apps/web/src/lib/api/staff.ts
- apps/web/src/lib/api/studio-directory.ts

## QA

- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/lib/api/__tests__/barbers-by-studio.test.ts` exit 0
- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/barbers/__tests__/barber-studios.test.tsx` exit 0
