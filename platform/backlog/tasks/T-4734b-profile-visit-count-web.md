# T-4734b · Visit count on the website profile

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4734a
- **StoryPoints**: 3

## What

Under the name on the website account card, show «Візитів: N» from the past visits the visits page already loads. Hide the line when that load fails. Do not render the visit cards.

## Why

The list is already on the site. The profile never reads the count.

## Sources

- T-4734a
- `apps/web/src/app/account/AccountProfileCard.tsx`
- `apps/web/src/app/account/appointments/useAppointmentsPage.ts`

## Done

- [ ] N matches the past list
- [ ] Zero renders
- [ ] An error hides the line

## Risks

- [ ] **A second appointments request with different filters.** Use the same past list
