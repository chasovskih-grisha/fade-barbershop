# T-4507a · Select (2/8)

- **Stage**: M1 (phase 2) · **Tags**: frontend, design · **Complexity**: middle · **Dependencies**: T-004
- **StoryPoints**: 2

## What

`Select` (dropdown) for `@fade/ui` with tokens: trigger + options list (portal), keyboard navigation (arrows, enter, escape, home/end), `aria-expanded`/`activedescendant`/`listbox`, disabled/placeholder/loading state, optional option group. Common with `docs/admin/16-shared.md` (categories, applicability, table filters) and web forms (T-4514 needs: blog/catalog filters). Taxonomy: single value, no multi-select in v1.

## Why

Select — most complex of missing primitives (combobox pattern). Extracted to separate slice: keyboard+aria require separate tests, and risk of overgrow into turnkey-combobox with search blocked by scope "single value, no search".

## Requirement sources

- `docs/admin/16-shared.md` §Shared UI Components (Select)
- `docs/design-system.md` §Components, §Tokens (focus/color)
- `docs/ux-guidelines.md` §Accessibility (focus, language)

## Done

- [x] Select in `packages/ui` with portal, aria states, keyboard (tests)
- [x] State variants (disabled/loading/error) with tokens, no hex
- [x] Unit tests (open/select/keyboard/escape); `pnpm docs:validate` green
