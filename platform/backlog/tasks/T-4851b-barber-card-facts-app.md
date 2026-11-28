# T-4851b · Slice: barber card facts in the app

- **Stage**: M5 (phase 30) · **Tags**: mobile, ux · **Complexity**: junior · **Depends on**: T-4851, T-4866, T-4869
- **StoryPoints**: 3

## What

The app barber card uses the same rule: name, and experience or specialties only when the payload has them. It does not copy the website’s default sentences.

## Why

A second client that invents “6+ years” would put the lie back on the phone.

## Sources

- T-4851
- T-4866

## Implementation plan

Paths:
- apps/mobile/src/components/BarberCard.tsx
- apps/mobile/src/app/(client)/barbers/page.tsx
- apps/mobile/src/lib/api/barbers.ts
- apps/mobile/src/components/BarberCard.test.tsx

Checks:
- `npx jest --config apps/mobile/jest.config.js --runTestsByPath apps/mobile/src/components/BarberCard.test.tsx`

## Done

- [x] A payload without specialties shows no chips
- [x] The card does not contain «Вільні вікна» or a rank
- [x] A test covers a bare name and a name with one specialty

## Risks

- [ ] **The card shipping before the payload.** The card reads T-4869. It does not hardcode a person

## Out of scope

- The website card (T-4851a)

## QA

- `npx jest --config apps/mobile/jest.config.js --runTestsByPath apps/mobile/src/components/BarberCard.test.tsx` exit 0
