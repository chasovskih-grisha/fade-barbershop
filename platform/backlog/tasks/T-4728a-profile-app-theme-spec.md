# T-4728a · Specify the profile theme constraint

- **Stage**: M1 (phase 3) · **Tags**: frontend, design, mobile · **Complexity**: junior · **Depends on**: T-4728
- **StoryPoints**: 2

## What

Add one sentence to `docs/client-screens.md` §5: the profile uses the app theme, raw colors are not part of the screen, and `accent.blue` is not a fill. Point at `docs/design-system.md` for the token rule. Do not paste a color table.

## Why

The screen drifted because the profile section never said which colors it is allowed to use.

## Sources

- T-4728
- `docs/client-screens.md` §5
- `docs/design-system.md`

## Done

- [x] §5 states the constraint in one sentence
- [x] `pnpm docs:validate` reports no new error from this file

## Risks

- [ ] **A second design system.** The sentence points at the existing one
