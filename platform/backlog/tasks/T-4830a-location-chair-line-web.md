# T-4830a · Slice: chair line on the website listing and studio page

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4830
- **StoryPoints**: 3

## What

Replace both chair badges with one line: the count of active chairs, plus a chair name when `name` is set. Same component on the card and on the studio page.

## Why

The two pages currently describe the same chairs with two different marketing lines.

## Sources

- T-4830
- `apps/web/src/app/locations/page.tsx`
- `apps/web/src/app/locations/[code]/LocationDetail.tsx`

## Done

- [ ] Listing and detail use one component
- [ ] A named chair shows the name; an unnamed chair shows only the count
- [ ] No pulse and no «приватний формат»
- [ ] A test covers named, unnamed, and zero active chairs

## Risks

- [ ] **A long list of chair names.** More than two names truncate with the count still visible

## Out of scope

- The app line (T-4830b)
