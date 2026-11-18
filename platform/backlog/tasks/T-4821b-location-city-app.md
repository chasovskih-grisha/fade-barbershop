# T-4821b · Slice: city groups on the app location list

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, mobile · **Complexity**: junior · **Depends on**: T-4821, T-4850, T-4843
- **StoryPoints**: 3

## What

The app location list groups studios by `addressParts.city` once T-4850 has put that field on the mobile DTO. A null city is a trailing unlabeled group. The list does not print Київ as a fallback.

## Why

The home list is the app’s only location surface today, and it has no city at all.

## Sources

- T-4821
- T-4850
- `apps/mobile/src/app/index-home.tsx`

## Done

- [ ] Studios with cities render under those city names
- [ ] A null city does not display «Київ» or any other guessed name
- [ ] A test with two cities and one null city asserts the group order

## Risks

- [ ] **The list ships before the DTO.** This slice waits for T-4850. It does not re-fetch a second endpoint

## Out of scope

- The website groups (T-4821a)
- The card chrome (T-4843)
