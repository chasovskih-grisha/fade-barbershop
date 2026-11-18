# T-4836b · Slice: barbers on the app studio screen

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, mobile · **Complexity**: middle · **Depends on**: T-4836, T-4844
- **StoryPoints**: 5

## What

The app studio screen lists the same barbers. A row opens nothing that this task has to invent: if the app has no barber screen, the row is not a dead control. It shows the name and the photo only.

## Why

A tappable row that goes nowhere is worse than a name.

## Sources

- T-4836
- T-4844

## Done

- [ ] The people match the location’s barber list
- [ ] A row does not navigate to a route that does not exist
- [ ] Empty assignments omit the section

## Risks

- [ ] **A later barber screen.** When an app barber screen exists, the row may link. This task does not build that screen

## Out of scope

- The website links (T-4836a)
- Building a barber profile in the app
