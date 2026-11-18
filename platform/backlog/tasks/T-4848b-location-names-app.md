# T-4848b · Slice: names on the app location card and studio screen

- **Stage**: M5 (phase 30) · **Tags**: frontend, a11y, mobile · **Complexity**: junior · **Depends on**: T-4848, T-4843, T-4844
- **StoryPoints**: 3

## What

The home card’s accessible name is the studio name plus the city when the city is shown. The studio screen’s back control, book control, and share control each have a name that includes the studio name when the screen has more than one action.

## Why

A row of identical «Записатися» buttons in the tree does not say which studio.

## Sources

- T-4848
- T-4843
- T-4844

## Done

- [ ] The card name includes the studio name
- [ ] Book and share names include the studio name
- [ ] A test reads the names

## Risks

- [ ] **A name longer than the visible label.** The visible label stays short. The accessible name may add the studio

## Out of scope

- The website names (T-4848a)
