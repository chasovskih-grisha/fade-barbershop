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

- [x] N matches the past list
- [x] Zero renders
- [x] An error hides the line

## Risks

- [x] **A second appointments request with different filters.** `useVisitSummary` loads `getAppointments` once per page and feeds both the next-visit card and the count

## Status

- `review` 2026-11-20. `countPastVisits` in `next-visit.ts`; `useVisitSummary` replaced
  `useNextVisit` so the profile keeps one `getAppointments` call for both the next-visit
  card and the count. `AccountProfileCard` takes `visitCount: number | null` — `null`
  hides the line, so a failed load never renders a confident zero. 19 tests in
  `visit-count.test.tsx` / `next-visit.test.ts` / `phone-change.test.tsx`.
