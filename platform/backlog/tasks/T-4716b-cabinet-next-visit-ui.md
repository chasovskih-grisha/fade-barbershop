# T-4716b · Next-visit card on the profile

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4716a
- **StoryPoints**: 5

## What

Build the card from slice a on `apps/web/src/app/account/page.tsx`, above `AccountProfileCard`.

- Read the upcoming visits the visits page already loads. Do not add a second endpoint and do not copy the list into profile state by hand if that hook can be reused.
- Show the nearest one. Format the date the way the visits list already does.
- "Details" links to `/account/appointments`. "Book" links to `/booking`.
- The profile cards render in the same cases they render today, including while the card is loading and when the visits request fails.
- Tokens only. The card stays under the file-size gate. If the page file would cross it, the card is its own component.

## Why

The profile is the page `/account` actually renders.

## Sources

- T-4716a
- `apps/web/src/app/account/page.tsx`
- `apps/web/src/app/account/appointments/useAppointmentsPage.ts`

## Done

- [ ] An upcoming visit appears above the name field, with "Details"
- [ ] No upcoming visit shows the empty line and "Book"
- [ ] A failed visits request leaves the profile usable

## Risks

- [ ] **The profile page is already a client form.** The card joins that page. It does not become a second layout around the cabinet
