# T-4830 · The chair line counts chairs and does not say they are open

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-021, T-4850
- **StoryPoints**: 6

## What

The listing badge says "2 chairs open" with a pulsing dot, which reads as live availability. The detail badge says "chairs (private format)". Both are the count of `chairs` with `active`. The line names the count, and a chair `name` when the record has one. It does not pulse and does not say the chair is free. Slices: website (T-4830a), app (T-4830b).

## Why

A guest who sees “open chairs” expects a free slot. The number is furniture.

## Sources

- `apps/web/src/app/locations/page.tsx`
- `apps/web/src/app/locations/[code]/LocationDetail.tsx`
- T-040 (the two-chair invariant is capacity, not a live lamp)

## Done

- [ ] T-4830a and T-4830b are done
- [ ] The word "open" is not the chair line

## Risks

- [ ] **Zero active chairs.** The line is omitted, not “0 chairs open”

## Out of scope

- Live slots (T-130) and the open/closed badge (T-4442)
