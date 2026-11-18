# T-4731a · Specify the saved-note quote

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4731
- **StoryPoints**: 2

## What

Add the quote to `docs/web-cabinet-screens.md` §2 under preferences, and point `docs/client-screens.md` §5 at it.

- Read-only.
- Content is the last saved lines, joined as the client wrote them.
- Empty: «Майстер ще нічого не побачить».
- Unsaved edits do not change it.

## Why

The hint promises the barber will see the text. The spec never shows which text.

## Sources

- T-4731
- `docs/web-cabinet-screens.md` §2

## Done

- [ ] §2 describes the quote and the empty sentence
- [ ] §5 points at §2
- [ ] `pnpm docs:validate` reports no new error from these files

## Risks

- [ ] **A preview of the draft.** The spec says saved lines only
