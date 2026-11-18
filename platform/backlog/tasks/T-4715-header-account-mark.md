# T-4715 · Header shows the client is in

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux, a11y · **Complexity**: middle · **Depends on**: T-4508, T-032
- **StoryPoints**: 7

## What

The public header always draws the same person icon, labelled «Client Account», and it always goes to `/account`. A client who has just signed in cannot tell from the header. The icon has to become their account mark, and a signed-out visitor has to see a way in.

The session already exists. `AuthProvider` loads the client from `/api/auth/me`. The client has a name or no name, and a phone. There is no photo. The header does not grow a menu and does not gain a logout. «Log out» stays on the profile.

## Why

The cabinet link is the only account control on every public page. While it looks the same before and after sign-in, the client has to open the cabinet to learn whether the visit they just booked is theirs.

## Sources

- `apps/web/src/app/components/shell/SiteHeader.tsx`
- `apps/web/src/app/components/shell/MobileNav.tsx`
- `apps/web/src/app/components/auth/AuthProvider.tsx`
- `docs/web-cabinet-screens.md` §1
- ADR 0005

## Done

- [ ] Slices a and b are `done`
- [ ] Signed out, the header control reads «Sign in» and opens login
- [ ] Signed in, the same control shows the client's initials and opens `/account`
- [ ] The mobile menu uses the same words and the same destination

## Risks

- [ ] **A flash of the wrong person.** Auth loads on the client. Until it resolves, the control stays the signed-out icon. It does not paint initials and then remove them
- [ ] **Two names.** `Avatar` announces itself. The link owns the accessible name. The mark inside is hidden from the accessibility tree
- [ ] **A blue status dot.** `Avatar` paints `accent.blue` when a status is set and unknown. This mark sets no status

## Out of scope

- A header menu, logout, or the next visit. Logout stays on the profile. The next visit is T-4716
- Where login sends the client afterwards. The cabinet guard is T-4718. This task only chooses the login URL
- The app. The home control there is T-4717
- A client photo. Clients have no photo. Initials, or the person glyph when the name is empty
