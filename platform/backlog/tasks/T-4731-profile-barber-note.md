# T-4731 · The client sees the note the barber will read

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4721a
- **StoryPoints**: 8

## What

The preference field says the barber will see the text. It does not show the text the way the barber sees it: the stored lines, not the unsaved textarea, and not a second editor.

Under the field, both profiles show a read-only quote of the last saved note. Empty saved note: "The barber won't see anything yet". Unsaved typing does not change the quote until save succeeds. The quote is not editable.

## Why

Clients write a paragraph and wonder what arrives in the chair. Showing the saved lines answers that without another screen.

## Sources

- `apps/web/src/app/account/AccountPreferencesCard.tsx`
- `docs/web-cabinet-screens.md` §2
- T-4721

## Done

- [x] Slices a, b, and c are `done`
- [x] The quote matches the last successful save
- [x] Typing without saving leaves the quote unchanged
- [x] An empty save shows "The barber won't see anything yet"

## Risks

- [ ] **A live mirror of the textarea.** The quote is the stored note. The field is the draft
- [ ] **Editing from the quote.** The quote is read-only

## Out of scope

- Admin or barber editing of the note
- The preference limit rules (T-4721). This task only displays the saved value

## Re-verified at 91202f68

Parent of three slices: T-4731b and T-4731c closed at `91202f68`, T-4731a (`m1.md:101` → `review`)
is a docs-only spec whose review commit `dcf43975` adds no owned product file, so it cannot pass
`qaTask`. The umbrella stays open on that slice alone.
