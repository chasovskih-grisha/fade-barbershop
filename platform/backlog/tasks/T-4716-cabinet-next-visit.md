# T-4716 · The cabinet opens on the next visit

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-032
- **StoryPoints**: 7

## What

`/account` is the profile form: name, preferences, notifications. The visit the client just booked is a different page. The front door of the cabinet should show that visit before the form.

One card, above the account section. Date and time, service, barber, location, and a link «Деталі» to `/account/appointments`. No upcoming visit: one line «Немає найближчого візиту» and «Записатися». Past visits stay on the visits page. The profile, the sidebar, and «Вийти» stay where they are.

## Why

The header (T-4715) and the login default both land on the cabinet. A client who follows either one currently meets a name field, not the visit.

## Sources

- `docs/web-cabinet-screens.md` §2
- `docs/client-screens.md` §1 (the app already specifies this card)
- `apps/web/src/app/account/page.tsx`
- `apps/web/src/app/account/appointments/page.tsx`

## Done

- [ ] Slices a and b are `done`
- [ ] With an upcoming visit, `/account` shows it above the profile
- [ ] With none, the page shows the empty line and «Записатися», and the profile is still there

## Risks

- [ ] **A second visit list.** This card is the nearest upcoming visit. It is not the «Майбутні | Минулі» page
- [ ] **A spinner instead of the profile.** If the visits request is slow or fails, the profile still renders. The card waits, or it hides

## Out of scope

- Reschedule, reference, and deposit actions. Those stay on the visit
- The header mark (T-4715) and the app home (T-4717)
- Moving «Вийти» or the sidebar

## Implementation plan

Paths:
- apps/web/src/app/account/NextVisitSection.tsx

Checks:
- pnpm --filter web build

## Implementation notes

- apps/web/src/app/account/NextVisitSection.tsx
