# T-4723b · One sign-out in the website cabinet

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4723a
- **StoryPoints**: 3

## What

Remove the «Вийти» button from the profile page header. Keep the aside button. It opens the confirm from slice a, then calls the existing `logout`. Cancel closes the confirm and stays on the page.

## Why

The profile header and the aside currently do the same thing with no confirm.

## Sources

- T-4723a
- `apps/web/src/app/account/page.tsx`
- `apps/web/src/app/account/components/AccountShell.tsx`

## Done

- [ ] The profile page has no «Вийти»
- [ ] The aside button confirms, and cancel does not call logout

## Risks

- [ ] **A second dialog component.** Use the cabinet's existing dialog pattern if one is already on the visits page. Do not invent a new modal system
