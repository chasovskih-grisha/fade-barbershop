# T-4857a · Slice: find a barber on the website

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4857
- **StoryPoints**: 3

## What

A labeled text field on `/barbers` filters cards by name, case-insensitive. Clearing it restores the groups from T-4852.

## Why

The website list is the one the guest can already open.

## Sources

- T-4857
- `apps/web/src/app/barbers/page.tsx`

## Done

- [ ] A partial name leaves the matching cards
- [ ] No match shows a sentence and a way to clear
- [ ] The field is before the cards in tab order

## Risks

- [ ] **Filtering across groups.** A match in one studio does not drop that studio’s heading if the group still has a card. An empty group hides its heading

## Out of scope

- The app field (T-4857b)
