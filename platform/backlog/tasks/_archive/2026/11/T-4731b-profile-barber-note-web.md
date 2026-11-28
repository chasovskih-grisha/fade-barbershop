# T-4731b · Saved-note quote on the website

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4731a, T-4721b
- **StoryPoints**: 3

## What

Under the website preferences field, render the quote from slice a. Bind it to the last loaded or last successfully saved preferences, not to the textarea state.

## Why

The field is already on the card. The quote is the missing line under the hint.

## Sources

- T-4731a
- `apps/web/src/app/account/AccountPreferencesCard.tsx`

## Done

- [x] Typing does not change the quote
- [x] A successful save does
- [x] Empty saved note shows the empty sentence

## Risks

- [ ] **A second textarea.** The quote is text, not an input

## Implementation plan

The quote and its draft already ship in the review commit; the plan names the
files so the gate can see the test that covers them.

Paths:
- `apps/web/src/app/account/preferences.ts`
- `apps/web/src/app/account/saved-note-quote.test.tsx`

Checks:
- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/account/saved-note-quote.test.tsx`

## QA

- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/account/saved-note-quote.test.tsx` exit 0
