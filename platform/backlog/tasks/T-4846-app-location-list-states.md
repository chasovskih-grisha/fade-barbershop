# T-4846 · The app location list has a skeleton, an empty line, and an error

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, mobile · **Complexity**: junior · **Depends on**: T-4843, T-4513
- **StoryPoints**: 3

## What

While locations load, the home shows the text «Завантаження...». If `fetchLocations` throws, `index.tsx` clears the flag and the list renders as if there were no studios.

Loading is a card-shaped skeleton in the location section. An empty payload is one sentence that the list is empty. A failed request is an error sentence and a retry, and it is not the empty sentence. The services block follows the same three states for its own request.

## Why

A failed network currently looks like the company has no studios.

## Sources

- `apps/mobile/src/app/index.tsx`
- `apps/mobile/src/app/index-home.tsx`
- T-4429 (offline cache is separate)

## Done

- [ ] Loading shows skeleton cards, not the word «Завантаження...»
- [ ] An empty array shows the empty sentence
- [ ] A thrown fetch shows the error and retry, and does not show the empty sentence
- [ ] Retry calls the fetch again
- [ ] A test covers the three states

## Risks

- [ ] **One failed call blanking the other.** Locations and services fail independently. A location error does not hide a services list that loaded

## Out of scope

- The offline cache (T-4429)
- Website empty and error states (T-4513, done)
