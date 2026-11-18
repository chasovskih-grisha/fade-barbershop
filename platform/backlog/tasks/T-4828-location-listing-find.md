# T-4828 · Find a studio by name or street

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-030, T-4850
- **StoryPoints**: 6

## What

Neither the website listing nor the app home can narrow the studios. The guest types a street or a name and the cards filter. No match is a sentence on that list, not the catalog empty state («Локацій ще немає»). Clearing the query restores the full list. Slices: website (T-4828a), app (T-4828b).

## Why

With Kyiv and Lviv on one page, scrolling is the only way to find a street the guest already knows.

## Sources

- `apps/web/src/app/locations/page.tsx`
- `apps/mobile/src/app/index-home.tsx`
- T-4614e (the empty catalog is a different state)

## Done

- [ ] T-4828a and T-4828b are done
- [ ] The no-match sentence is not the empty-catalog empty state

## Risks

- [ ] **Hiding studios.** The filter never drops a studio from the payload. It only hides cards

## Out of scope

- Server search (T-3801)
- The empty catalog copy (T-4614e)
