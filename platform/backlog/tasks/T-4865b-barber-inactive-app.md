# T-4865b · Slice: an inactive barber in the app

- **Stage**: M5 (phase 30) · **Tags**: mobile, ux · **Complexity**: junior · **Depends on**: T-4865, T-4867
- **StoryPoints**: 3

## What

The app list hides inactive barbers. A direct open shows the name, the explanation, and a way back to the list. No book control.

## Why

A deep link can outlive the job.

## Sources

- T-4865
- T-4867

## Implementation plan

Paths:
- apps/mobile/src/lib/api/barbers.ts
- apps/mobile/src/app/(client)/barbers/page.tsx
- apps/mobile/src/app/(client)/barbers/[slug]/page.tsx
- apps/mobile/src/app/(client)/barbers/[slug]/barber-screen-states.tsx
- apps/mobile/src/lib/api/barbers.test.ts
- apps/mobile/src/app/(client)/barbers/[slug]/page.test.tsx

Checks:
- `npx jest --config apps/mobile/jest.config.js --runTestsByPath "apps/mobile/src/lib/api/barbers.test.ts"`
- `npx jest --config apps/mobile/jest.config.js --runTestsByPath "apps/mobile/src/app/(client)/barbers/[slug]/page.test.tsx"`

## Done

- [x] The list skips `active: false`
- [x] The direct open has no book control
- [x] A test covers both

## Risks

- [ ] **A missing flag.** When the payload has no `active`, the person is shown. This task does not guess

## Out of scope

- The website page (T-4865a)

## Implementation notes

- apps/mobile/src/app/(client)/barbers/[slug]/barber-screen-states.tsx
- apps/mobile/src/app/(client)/barbers/[slug]/page.test.tsx
- apps/mobile/src/app/(client)/barbers/[slug]/page.tsx
- apps/mobile/src/app/(client)/barbers/page.test.tsx
- apps/mobile/src/lib/api/barbers.test.ts
- apps/mobile/src/lib/api/barbers.ts

## QA

- `npx jest --config apps/mobile/jest.config.js --runTestsByPath "apps/mobile/src/lib/api/barbers.test.ts"` exit 0
- `npx jest --config apps/mobile/jest.config.js --runTestsByPath "apps/mobile/src/app/(client)/barbers/[slug]/page.test.tsx"` exit 0
