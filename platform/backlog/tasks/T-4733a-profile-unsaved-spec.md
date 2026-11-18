# T-4733a · Specify the unsaved-edit prompt

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4733
- **StoryPoints**: 2

## What

Add the prompt to `docs/web-cabinet-screens.md` §2 and point `docs/client-screens.md` §5 at it.

- Triggers: name or preference note differs from the last saved value, and the client opens another account screen.
- «Зберегти зміни?» with «Зберегти», «Не зберігати», «Залишитись».
- Failed save stays.
- Does not trigger for notification switches, sign-out, or a clean form.

## Why

The docs say the fields save with a button. They do not say what a navigation in the middle of typing does.

## Sources

- T-4733
- `docs/web-cabinet-screens.md` §2

## Done

- [ ] §2 names the three answers and the cases that do not ask
- [ ] §5 points at §2
- [ ] `pnpm docs:validate` reports no new error from these files

## Risks

- [ ] **A browser beforeunload essay.** The spec is the in-product prompt. It does not require a custom browser dialog
