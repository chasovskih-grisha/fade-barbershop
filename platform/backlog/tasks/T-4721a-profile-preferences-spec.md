# T-4721a · Specify the shared preference note

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4721
- **StoryPoints**: 2

## What

Record the existing limit in `docs/web-cabinet-screens.md` §2, and point `docs/client-screens.md` §5 at it.

- One note, stored as at most 20 non-empty lines, each at most 100 characters after trim.
- The client-facing refusal is «Не більше 20 рядків, до 100 символів у рядку».
- The hint «Цей текст побачить ваш майстер перед візитом» is part of the section on both surfaces.
- Empty note is allowed. It clears the stored lines.

## Why

The route enforces the limit and the screen docs do not mention it, so the app has nothing to copy.

## Sources

- T-4721
- `docs/web-cabinet-screens.md` §2
- `apps/web/src/app/api/account/preferences/route.ts`

## Done

- [ ] §2 states the limit, the Ukrainian refusal, and the hint
- [ ] §5 points at §2
- [ ] `pnpm docs:validate` reports no new error from these files

## Risks

- [ ] **Changing the storage.** The note remains the current string array. This slice does not add a new column
