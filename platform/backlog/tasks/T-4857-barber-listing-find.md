# T-4857 · Find a barber by name

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4852
- **StoryPoints**: 6

## What

Neither directory can narrow people by name. The guest types a name and the cards filter. No match is a sentence on that list, not the empty-team state "Team is still forming". Slices: website (T-4857a), app (T-4857b).

## Why

With several studios on one page, the name the guest already knows should not require a scroll.

## Sources

- `apps/web/src/app/barbers/page.tsx`
- T-4614e (the empty team is a different state)

## Done

- [ ] T-4857a and T-4857b are done
- [ ] A miss is not the empty-team empty state

## Risks

- [ ] **Hiding people from the payload.** The filter only hides cards

## Out of scope

- Server search (T-3801)
- Specialty chips (T-4853)
