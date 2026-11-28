# T-4828a · Slice: find a studio on the website listing

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4828
- **StoryPoints**: 3

## What

A text field on `/locations` filters the loaded cards by name and address. The match is case-insensitive and ignores surrounding spaces. The field is labeled, and the result count is a text node, not only a color.

## Why

The website list is short enough to filter on the client.

## Sources

- T-4828
- `apps/web/src/app/locations/page.tsx`

## Done

- [x] Typing a street leaves only the studios whose name or address contains it
- [x] No match shows a sentence and a way to clear the field
- [x] Clearing the field shows every studio again
- [x] The field is reachable by keyboard before the cards

## Risks

- [ ] **Filtering before the list arrives.** The field is inert, not hidden, while the skeleton is up

## Out of scope

- The app field (T-4828b)
