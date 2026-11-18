# T-4832a · Slice: today’s hours on the website

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4832
- **StoryPoints**: 3

## What

On the studio page, today’s row is visually first among equals: the day name and the interval, then the other six days. The listing card from T-4820 keeps a single today line; this slice is the full week on the studio page. Empty `hours` render «Графік ще не вказано» inside the hours region.

## Why

An empty component that returns null looks like the studio has no hours section at all.

## Sources

- T-4832
- `apps/web/src/app/locations/[code]/LocationHours.tsx`

## Done

- [ ] Today’s row is distinct and the other days remain
- [ ] A closed today says «Вихідний»
- [ ] An empty list shows the sentence, not a blank card
- [ ] A test freezes the day index and asserts which row is marked

## Risks

- [ ] **Sunday index.** The component’s comment says 0 is Monday. The test uses that index, not `Date.getDay()`

## Out of scope

- The app week (T-4832b)
- The one-line card fact (T-4820)
