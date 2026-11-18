# T-4866 · The app has a barber directory of cards

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, mobile, design · **Complexity**: middle · **Depends on**: T-070, T-4867, T-4869
- **StoryPoints**: 5

## What

The app home lists locations and services. It has no people. Visits show a barber name and nothing else.

Add a barber directory the guest can open from the client shell. Each active barber is a card: name, and the studio when T-4852b has grouped them. Pressing the card opens the screen from T-4867. This directory does not replace the location cards from T-4843.

## Why

The phone guest can book a place and cannot choose a person before they are inside the flow.

## Sources

- `apps/mobile/src/app/index-home.tsx`
- T-4843 (location cards stay)

## Done

- [ ] The directory is a route of its own
- [ ] Each card opens the barber screen
- [ ] The home location list is unchanged
- [ ] A test presses a card and asserts the route

## Risks

- [ ] **The card before the screen.** This task depends on T-4867. It does not push a missing route

## Out of scope

- Card facts (T-4851b), groups (T-4852b), chips (T-4853b), find (T-4857b)
- The location home (T-4843)
