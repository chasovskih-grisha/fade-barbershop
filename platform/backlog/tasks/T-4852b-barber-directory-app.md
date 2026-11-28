# T-4852b · Slice: the app directory groups barbers by studio

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4852, T-4866, T-4869
- **StoryPoints**: 3

## What

The app barber list uses the same grouping: one group per studio, one card per person.

## Why

The phone directory has to match the site or the guest thinks a studio has no one.

## Sources

- T-4852
- T-4866

## Done

- [x] Two studios render two headings
- [x] A shared barber renders once
- [x] A test covers both

## Risks

- [ ] **A studio with no barbers.** The heading is omitted

## Out of scope

- The website groups (T-4852a)

## Closed 2026-11-27 (reconciliation)

The slice was already in the tree in `e3f6dac` while the index row stayed `todo`.
`fetchBarbersByStudio` (`apps/mobile/src/lib/api/studio-roster.ts`) asks each active studio
and keeps a shared person in the first one; `BarberStudioGroups`
(`apps/mobile/src/app/(client)/barbers/barber-studio-groups.tsx`) renders one heading per
studio and is wired in `barbers/page.tsx`. `studio-roster.test.ts` (3) covers two headings,
the shared barber once, and the studio with no listed people; `barbers/page.test.tsx`
asserts both studio headings. No code change was needed.
