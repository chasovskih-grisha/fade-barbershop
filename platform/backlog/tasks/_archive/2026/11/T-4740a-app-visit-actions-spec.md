# T-4740a · Specify the app visit actions

- **Stage**: M2 (phase 10) · **Tags**: frontend, ux, mobile · **Complexity**: junior · **Depends on**: T-4740
- **StoryPoints**: 2

## What

In `docs/client-screens.md` §4, state that the app row's reschedule and cancel follow the website cabinet: same slot rules, same cancel sentences as T-4737, and neither action on a completed visit. The header may say the client can reschedule only once the button is there.

## Why

§4 already lists the actions for the client. It does not say the app row is missing them, so a done shell task can leave the row without buttons.

## Sources

- T-4740
- `docs/client-screens.md` §4
- T-4737a

## Done

- [ ] §4 ties the app buttons to the website rules
- [ ] `pnpm docs:validate` reports no new error from this file

## Risks

- [ ] **A shorter app policy.** The cancel sentences are not rewritten for the phone
