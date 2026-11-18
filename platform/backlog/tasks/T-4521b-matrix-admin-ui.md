# T-4521b · Admin UI for matrix & flow impact (4/8)

- **Stage**: M1 (phase 4) · **Tags**: frontend, backend · **Complexity**: middle · **Depends on**: T-4521a, T-4507, T-041
- **StoryPoints**: 4

## What

Admin interface "barber services": barber card → drawer with location services list, Select/Toggle from T-4507, modes "all / selected only / by category". Booking-flow step 2: barbers without the selected service are hidden (with reason on the "Any" page — show nearest available among those performing the service). father-son parallel — only barbers with overlapping services; otherwise disabled (link to T-4521a).

## Why

Without admin UI, the matrix is inaccessible to the operator; without correct step 2, domain changes create scenarios where "slot is selected, but barber does not perform it". The UI part is extracted separately because it depends on form primitives T-4507 (phase 2).

## Sources

- `docs/admin-screens.md` §4–5 (barbers, drawers, calendar)
- `docs/booking-flow.md` §Screen 2, §father-son
- `docs/design-system.md` §Components (Select/Toggle)

## Done

- [ ] Matrix drawer without hardcoded hex; "all/selected/category" works
- [ ] Step 2 filters; father-son disabled on zero intersection
- [ ] e2e test case in booking-flow-tests; `pnpm docs:validate` green
