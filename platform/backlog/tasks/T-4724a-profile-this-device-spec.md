# T-4724a · Specify the profile device row

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4724
- **StoryPoints**: 2

## What

Add the row to `docs/web-cabinet-screens.md` §2, under the account section, and point `docs/client-screens.md` §5 at it.

- Channel of the current session, «Цей пристрій», link to the devices screen.
- «Ще {N}» only when N is loaded and greater than zero.
- Load error: the link remains, the count is absent.
- No revoke on this row.

## Why

The devices screens exist. The profile spec does not mention them, so they stay undiscoverable.

## Sources

- T-4724
- `docs/web-cabinet-screens.md` §2
- `docs/client-screens.md` §5

## Done

- [ ] §2 describes the row, the count, and the error
- [ ] §5 points at §2
- [ ] `pnpm docs:validate` reports no new error from these files

## Risks

- [ ] **A device manager in the spec.** The devices pages keep their own description
