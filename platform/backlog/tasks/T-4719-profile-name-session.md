# T-4719 · The saved name is the name on the account

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-032, T-072
- **StoryPoints**: 12

## What

The site saves a name with `PATCH /api/account/name`, which forwards to `PATCH /identity/profile/name`. The page never reloads the session, so the cabinet heading keeps the previous name. The app profile has no name field. It shows a push token instead.

Both surfaces edit the same name. A successful save trims the value and refreshes the session the screen already holds. An empty or whitespace-only name is refused on the screen with «Вкажіть ім'я» and is not sent. The route's English «Name is required» is not the sentence the client reads.

## Why

The cabinet introduces the client by name. A save that the heading does not show looks like the account forgot them. The app cannot show a name it never edits.

## Sources

- `apps/web/src/app/account/page.tsx`
- `apps/web/src/app/api/account/name/route.ts`
- `apps/mobile/src/app/(client)/account/profile/index.tsx`
- `docs/client-screens.md` §5
- `docs/web-cabinet-screens.md` §2

## Done

- [ ] Slices a, b, and c are `done`
- [ ] Saving «Олексій» on the site updates the cabinet heading without a manual reload
- [ ] The app profile edits the same name and shows it after the next open
- [ ] An empty name stays on the screen with «Вкажіть ім'я»

## Risks

- [ ] **A second name field.** The app calls `PATCH /identity/profile/name`. It does not keep a name that the site does not read
- [ ] **Wiping a name by accident.** Whitespace is not a clear. The previous name remains

## Out of scope

- Phone replacement. That command already exists (T-4620). The leftover support sentence is T-4720
- Header initials (T-4715). This task refreshes the session those initials read
- Asking for a missing name (T-4726)
