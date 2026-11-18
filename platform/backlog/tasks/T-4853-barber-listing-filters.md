# T-4853 · Barber filters narrow the list, or they are not on the page

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4851, T-4852
- **StoryPoints**: 8

## What

The listing hero renders four pills: «Усі майстри», «Топ-барбери», «Експерти бороди», «Фейд-спеціалісти». They are `span` elements with `cursor-pointer`. Nothing filters.

A chip exists only for a specialty the loaded records actually contain, plus «Усі» when there is more than one chip. Choosing a chip hides cards that lack that specialty. The rank chips are removed. Slices: website (T-4853a), app (T-4853b).

## Why

A control that looks like a filter and does nothing teaches the guest that the directory is decorative.

## Sources

- `apps/web/src/app/barbers/page.tsx`
- T-4851 (chips on a card are not these filters)

## Done

- [ ] T-4853a and T-4853b are done
- [ ] «Топ-барбери» and «Фейд-спеціалісти» are not rendered as ranks

## Risks

- [ ] **No specialties on any record.** The chip row is absent. The full list remains

## Out of scope

- A taxonomy of ranks in the database
- Search by name (T-4857)
