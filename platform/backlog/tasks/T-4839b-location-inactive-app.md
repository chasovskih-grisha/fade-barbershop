# T-4839b · Slice: an inactive studio in the app

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4839, T-4844
- **StoryPoints**: 3

## What

If the app opens a code with `active: false`, the screen shows the studio name, says it is not taking bookings, and returns to the list. It has no book control. An inactive studio is not offered as a card on the home list.

## Why

A deep link can outlive a studio. The home list should not be the way to reach a closed one.

## Sources

- T-4839
- T-4844

## Done

- [ ] The home list does not render `active: false`
- [ ] A direct open of an inactive code shows the explanation and a back control
- [ ] That screen has no book control

## Risks

- [ ] **The list endpoint already filters inactive studios.** The direct-open case still handles `active: false` on the detail payload

## Out of scope

- The website page (T-4839a)
