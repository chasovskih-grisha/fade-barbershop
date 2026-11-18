# T-4853b · Slice: working specialty chips in the app

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, mobile · **Complexity**: junior · **Depends on**: T-4853, T-4866
- **StoryPoints**: 3

## What

The app directory uses the same chip rule on the cards T-4866 renders.

## Why

The phone list will otherwise ship the decorative pills next.

## Sources

- T-4853
- T-4866

## Done

- [ ] Chips come from the payload specialties
- [ ] A list with no specialties has no chip row
- [ ] A test covers one specialty and the empty case

## Risks

- [ ] **Horizontal chip scroll stealing the vertical list.** Chips wrap

## Out of scope

- The website chips (T-4853a)
