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
