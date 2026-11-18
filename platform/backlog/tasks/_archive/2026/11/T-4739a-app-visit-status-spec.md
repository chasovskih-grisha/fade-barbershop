# T-4739a · Specify the app visit status labels

- **Stage**: M2 (phase 10) · **Tags**: frontend, ux, mobile · **Complexity**: junior · **Depends on**: T-4739
- **StoryPoints**: 2

## What

Under `docs/client-screens.md` §4, name the four labels the app row shows: майбутній, підтверджено, завершено, скасовано, matching the website cabinet's words for those states. State that the color is a theme token, and that the empty state says «Записатися» without a URL path. The header promises only the actions the row has.

## Why

§4 describes badges. The app prints the stored enum, so the spec never constrained the word.

## Sources

- T-4739
- `docs/client-screens.md` §4

## Done

- [x] The four labels and the empty-state rule are in §4
- [x] `pnpm docs:validate` reports no new error from this file

## Risks

- [ ] **A new status.** The four are the ones the row already receives
