# T-4859 · The barber card has one destination and says so

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4851
- **StoryPoints**: 3

## What

The whole card is already a link to `/barbers/{slug}`. The footer then says "Portfolio and free slots" and "Select barber", which are two different promises inside one link.

The footer is one line: the profile. It does not mention free slots. Activating any part of the card goes to the profile and nowhere else.

## Why

A card that offers a portfolio, a slot, and a selection, and then opens one page, is three labels for one action.

## Sources

- `apps/web/src/app/barbers/BarberCard.tsx`

## Implementation plan

The card already has one href and one footer line. What it does not do is say
that destination to someone who cannot see the footer: the link's accessible
name is the person's name, so a screen reader announces «Олександр, посилання»
and stops there. The plan points the link at the footer line as its description,
so the destination is spoken while the visible copy stays the same one line.

Paths:
- apps/web/src/app/barbers/BarberCard.tsx
- apps/web/src/app/barbers/__tests__/BarberCard.test.tsx

Checks:
- npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/barbers/__tests__/BarberCard.test.tsx

## Done

- [x] The footer does not say "free slots"
- [x] The card has a single href, the profile
- [x] A test asserts that href and the absence of the slot sentence
- [x] The link names the footer line as its description, so the destination is spoken

## Risks

- [x] **A nested link.** There is no second anchor inside the card

## Out of scope

- The book control on the profile (T-4477b, T-4860)

## Implementation notes

- apps/web/src/app/barbers/BarberCard.tsx
- apps/web/src/app/barbers/__tests__/BarberCard.test.tsx

## QA

- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/barbers/__tests__/BarberCard.test.tsx` exit 0


