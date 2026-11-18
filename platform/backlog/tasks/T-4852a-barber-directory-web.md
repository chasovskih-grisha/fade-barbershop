# T-4852a · Slice: the website directory groups barbers by studio

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4852
- **StoryPoints**: 5

## What

`/barbers` requests barbers for each active location and renders a group per studio, using the studio name and city from T-4821. One person with two assignments is one card.

## Why

The current helper hides every studio after the first.

## Sources

- T-4852
- `apps/web/src/lib/api/staff.ts`
- `apps/web/src/app/barbers/page.tsx`

## Done

- [ ] Two locations produce two groups
- [ ] A barber assigned to both appears once
- [ ] An empty location adds no empty group heading
- [ ] A test uses two location ids and one shared barber

## Risks

- [ ] **N requests.** The page fans out one request per active location and does not add a new aggregate endpoint in this slice

## Out of scope

- The app groups (T-4852b)
