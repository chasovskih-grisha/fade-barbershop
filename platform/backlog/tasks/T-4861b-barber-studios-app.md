# T-4861b · Slice: studios on the app barber screen

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, mobile · **Complexity**: middle · **Depends on**: T-4861, T-4867
- **StoryPoints**: 5

## What

The app barber screen lists the same studios. A row opens the app studio screen from T-4844 when that route exists. It does not invent a second location screen.

## Why

The phone guest needs the same place names.

## Sources

- T-4861
- T-4844
- T-4867

## Done

- [ ] The studios match the assignments
- [ ] A row opens the existing studio route with that code
- [ ] No assignment omits the section

## Risks

- [ ] **The studio screen is not on this branch yet.** The row shows the name and becomes a control when T-4844’s route is present. It does not navigate to a missing path

## Out of scope

- The website links (T-4861a)
