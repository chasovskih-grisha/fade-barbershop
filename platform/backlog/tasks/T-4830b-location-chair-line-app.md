# T-4830b · Slice: chair line on the app studio card

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, mobile · **Complexity**: junior · **Depends on**: T-4830, T-4850, T-4843
- **StoryPoints**: 3

## What

The app card and the studio screen show the same chair count the website shows, from the chairs on the payload T-4850 loads. No pulse, no “open”.

## Why

If the app card omits chairs, the two products describe the studio differently.

## Sources

- T-4830
- T-4850

## Done

- [ ] The count matches the active chairs on the payload
- [ ] Zero active chairs omit the line
- [ ] A test covers a named chair and an empty chair list

## Risks

- [ ] **Chairs missing on the list endpoint.** The line waits for the payload. It does not invent “2”

## Out of scope

- The website badges (T-4830a)
