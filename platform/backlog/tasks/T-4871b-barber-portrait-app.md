# T-4871b · Slice: the portrait on the app barber card and screen

- **Stage**: M5 (phase 30) · **Tags**: mobile, ux · **Complexity**: junior · **Depends on**: T-4871, T-4866, T-4867, T-4869
- **StoryPoints**: 3

## What

The app card and the app screen show the photo from the payload, or initials. No gradient over the face.

## Why

The phone is the surface where the face is the whole card.

## Sources

- T-4871
- T-4869

## Done

- [ ] A photo renders in the frame
- [ ] A null photo renders initials
- [ ] A test covers both

## Risks

- [ ] **A large photo blocking the list.** The card uses a fixed frame. The full image waits for the screen

## Out of scope

- The website portrait (T-4871a)

### Re-verified at 78dab8f8 (2026-11-26)

`apps/mobile/src/components/BarberPortrait.tsx` exists, is used by
`apps/mobile/src/app/(client)/barbers/[slug]/page.tsx` and `components/BarberCard.tsx`, and
`BarberPortrait.test.tsx` covers the photo and the missing-photo fallback. This slice is complete in
the tree and sits in `review`; the web sibling is T-4871a.

## Implementation plan

Paths:
- `apps/mobile/src/components/BarberPortrait.test.tsx`

Checks:
- `npx jest --config apps/mobile/jest.config.js --runTestsByPath apps/mobile/src/components/BarberPortrait.test.tsx`

## QA

- `npx jest --config apps/mobile/jest.config.js --runTestsByPath apps/mobile/src/components/BarberPortrait.test.tsx` exit 0
