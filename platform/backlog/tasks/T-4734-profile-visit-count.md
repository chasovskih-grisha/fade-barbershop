# T-4734 · The profile shows how many visits the client has

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-032, T-072
- **StoryPoints**: 8

## What

The admin's verified-client card can say how many visits a person has. The client's own profile does not. Under the name, both profiles show «Візитів: N», where N is the count of that client's past visits from the list the visits screen already loads. Zero is «Візитів: 0». It is not hidden.

The line does not list the visits and does not repeat the next-visit card (T-4716). A failed load hides the line. It does not show zero in place of an error.

## Why

The profile is the account summary. A name and a phone with no history makes the account look empty even after years of visits.

## Sources

- `apps/web/src/app/account/appointments/useAppointmentsPage.ts`
- `docs/web-cabinet-screens.md` §2
- `docs/client-screens.md` §5

## Done

- [ ] Slices a, b, and c are `done`
- [ ] The count matches the past visits on the visits screen
- [ ] A failed load hides the line
- [ ] The line is not a second visit list

## Risks

- [ ] **A new analytics query.** Count the past visits the cabinet already fetches. T-4580 owns a separate analytics surface
- [ ] **The next visit.** T-4716 is the upcoming card. This line is a count of past visits

## Out of scope

- T-4716
- T-4580
- Loyalty progress (T-142)
