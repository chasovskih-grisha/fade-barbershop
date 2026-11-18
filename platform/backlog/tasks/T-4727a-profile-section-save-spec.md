# T-4727a · Specify per-section save feedback

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4727
- **StoryPoints**: 2

## What

Add the three result sentences to `docs/web-cabinet-screens.md` §2 and point `docs/client-screens.md` §5 at them. State that a save in one section does not disable or rewrite another.

## Why

§2 says saving confirms inline. The page implements one shared banner, so "inline" is not specific enough.

## Sources

- T-4727
- `docs/web-cabinet-screens.md` §2

## Done

- [ ] §2 lists the three success sentences and the three failures
- [ ] §5 points at §2
- [ ] `pnpm docs:validate` reports no new error from these files

## Risks

- [ ] **A new copy for the app.** The sentences are the ones in §2
