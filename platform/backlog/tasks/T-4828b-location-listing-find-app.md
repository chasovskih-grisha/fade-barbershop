# T-4828b · Slice: find a studio on the app list

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, mobile · **Complexity**: junior · **Depends on**: T-4828, T-4843
- **StoryPoints**: 3

## What

The app location list gets the same name-or-street filter as the website. It filters the cards T-4843 renders. No match is one sentence and a clear control. It does not replace the services block.

## Why

The home list will grow past one city, and the rows are not searchable.

## Sources

- T-4828
- `apps/mobile/src/app/index-home.tsx`

## Done

- [ ] The filter narrows location cards and leaves the services block alone
- [ ] No match is a sentence, not an empty screen
- [ ] A test covers a hit, a miss, and a cleared query

## Risks

- [ ] **The filter covering the cards on a small phone.** The field is one row, and the cards scroll under it

## Out of scope

- The website field (T-4828a)
