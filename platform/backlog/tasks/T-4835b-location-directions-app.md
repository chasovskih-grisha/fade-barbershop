# T-4835b · Slice: a real map on the app studio screen

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, mobile · **Complexity**: middle · **Depends on**: T-4835, T-4844, T-4850
- **StoryPoints**: 5

## What

The app studio screen shows the address and one pin. A control opens the platform maps app at the coordinates. There is no invented walking copy.

## Why

On a phone, the useful action is to hand the pin to the maps app the person already uses.

## Sources

- T-4835
- T-4844

## Done

- [ ] The screen shows the stored address and one pin
- [ ] The maps control carries `lat` and `lng`
- [ ] No metro, parking, or coffee sentence is hardcoded

## Risks

- [ ] **No maps app.** The address remains selectable so the guest can copy it

## Out of scope

- The website map (T-4835a)
