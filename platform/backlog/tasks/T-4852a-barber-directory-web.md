# T-4852a · Slice: the website directory groups barbers by studio

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4852
- **StoryPoints**: 5

## What

`/barbers` requests barbers for each active location and renders a group per studio, using the studio name and city from T-4821. One person with two assignments is one card.

## Why

The current helper hides every studio after the first.

## Sources

- T-4852
- `apps/web/src/lib/api/staff.ts`
- `apps/web/src/app/barbers/page.tsx`

## Implementation plan

Paths:
- apps/web/src/lib/api/studio-directory.ts
- apps/web/src/app/barbers/page.tsx
- apps/web/src/app/barbers/BarbersClient.tsx
- apps/web/src/app/barbers/BarbersHeader.tsx
- apps/web/src/app/barbers/BarberCard.tsx
- apps/web/src/app/barbers/barbers-filter.ts
- apps/web/src/lib/api/__tests__/barbers-by-studio.test.ts
- apps/web/src/app/barbers/__tests__/barber-studio-groups.test.tsx

Checks:
- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/lib/api/__tests__/barbers-by-studio.test.ts`
- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/barbers/__tests__/barber-studio-groups.test.tsx`

## Done

- [x] Two locations produce two groups
- [x] A barber assigned to both appears once
- [x] An empty location adds no empty group heading
- [x] A test uses two location ids and one shared barber

## Risks

- [ ] **N requests.** The page fans out one request per active location and does not add a new aggregate endpoint in this slice

## Out of scope

- The app groups (T-4852b)

## Implementation notes

- apps/web/src/app/barbers/BarberCard.tsx
- apps/web/src/app/barbers/BarbersClient.tsx
- apps/web/src/app/barbers/BarbersHeader.tsx
- apps/web/src/app/barbers/__tests__/barber-breadcrumb.test.tsx
- apps/web/src/app/barbers/__tests__/barber-studio-groups.test.tsx
- apps/web/src/app/barbers/__tests__/barbers.test.tsx
- apps/web/src/app/barbers/__tests__/hero-facts.test.tsx
- apps/web/src/app/barbers/page.tsx
- apps/web/src/lib/api/__tests__/barbers-by-studio.test.ts
- apps/web/src/lib/api/studio-directory.ts

## QA

- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/lib/api/__tests__/barbers-by-studio.test.ts` exit 0
- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/barbers/__tests__/barber-studio-groups.test.tsx` exit 0
