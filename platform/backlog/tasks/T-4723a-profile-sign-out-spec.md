# T-4723a · Specify the single sign-out

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4723
- **StoryPoints**: 2

## What

Write the sign-out rule into `docs/web-cabinet-screens.md` §2 and point `docs/client-screens.md` §5 at it.

- One control, labelled "Sign out".
- Confirm "Sign out of this device?" with "Sign out" and "Cancel".
- Confirm ends the local session only.
- It does not change notification switches and does not revoke other sessions.

## Why

§2 lists "Sign out" on the account section and the shell also draws one. The docs never say there is only one, or what it does to push.

## Sources

- T-4723
- `docs/web-cabinet-screens.md` §2
- `docs/client-screens.md` §5

## Done

- [ ] Both docs describe one control and the confirm
- [ ] `pnpm docs:validate` reports no new error from these files

## Risks

- [ ] **A different confirm on the app.** The words are the same on both surfaces
