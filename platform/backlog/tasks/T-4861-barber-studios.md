# T-4861 · The profile names the studios where this barber works

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-023, T-4852, T-4860
- **StoryPoints**: 10

## What

The profile never says which studio the person cuts in. The directory in T-4852 already knows the assignments.

The studios region lists those locations by name and city, each linking to `/locations/{code}`. A barber with no assignment omits the region. Slices: website (T-4861a), app (T-4861b).

## Why

A name without a place does not tell the guest where to go.

## Sources

- `apps/web/src/lib/api/staff.ts`
- T-4852
- T-4836 (the studio page lists barbers; this is the reverse link)

## Done

- [ ] T-4861a and T-4861b are done
- [ ] Each studio link is a location code, not a barber id

## Risks

- [ ] **A studio that is inactive.** An inactive location is not linked as if it were open (T-4839)

## Out of scope

- The location page layout (T-4831)
- Related-content blocks (T-4482)
