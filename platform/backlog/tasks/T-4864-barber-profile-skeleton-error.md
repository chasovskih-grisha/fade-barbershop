# T-4864 · The barber profile skeleton and the barber error speak one language

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4513, T-4860
- **StoryPoints**: 5

## What

The profile has no `loading.tsx`. `barbers/error.tsx` titles itself «Помилка завантаження майстрів / Barbers Load Error», tells the guest the telemetry recorded it, and offers «Спробувати знову / Try again».

Loading uses the profile width and a portrait block plus two regions. The error shell uses that width, Ukrainian only, and a retry. It does not mention telemetry. It does not render the raw error message.

## Why

A bilingual error that talks about the logging system is not the guest’s sentence, and the profile currently has no skeleton at all.

## Sources

- `apps/web/src/app/barbers/error.tsx`
- `apps/web/src/app/barbers/[slug]/page.tsx`
- T-4612 (catalogs). This task removes the English duplicate. It does not migrate the route onto next-intl

## Implementation plan

Paths:
- apps/web/src/app/barbers/[slug]/loading.tsx
- apps/web/src/app/barbers/error.tsx
- apps/web/src/app/barbers/__tests__/barber-profile-states.test.tsx

Checks:
- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/barbers/__tests__/barber-profile-states.test.tsx`

## Done

- [x] `app/barbers/[slug]/loading.tsx` matches the profile width
- [x] The error title and the retry are Ukrainian, with no slash and no second language
- [x] The error body does not say телеметрія
- [x] A test covers the error render

## Risks

- [x] **The boundary swallowing a not-found.** `notFound()` stays the 404 path. The boundary is for a thrown error

## Out of scope

- Message catalogs (T-4612)
- The listing skeleton (T-4856)

## Implementation notes

- apps/web/src/app/barbers/[slug]/loading.tsx
- apps/web/src/app/barbers/__tests__/barber-profile-states.test.tsx
- apps/web/src/app/barbers/__tests__/error.test.tsx
- apps/web/src/app/barbers/error.tsx

## QA

- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/barbers/__tests__/barber-profile-states.test.tsx` exit 0
