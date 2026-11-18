# T-4507b · Toggle + Checkbox extension (2/8)

- **Stage**: M1 (phase 2) · **Tags**: frontend, design · **Complexity**: junior · **Dependencies**: T-004
- **StoryPoints**: 2

## What

`Toggle` (boolean switch) in `packages/ui` with tokens: native input under hood (accessibility "for free"), accent color on enabled, label left/right, disabled, blur keyboard. Slice T-4507b. If needed — extension of existing `Checkbox` (same selection pattern) as separate variant, if screen requires form parity.

## Why

Boolean flags (active/inactive by domains T-021, T-024, T-0400) don't need full combobox; Toggle made quickly and itself. Clarification of "native input > custom redrawn" convention — under upload text in T-4507 report.

## Requirement sources

- `docs/admin/16-shared.md` §Form Patterns (boolean)
- `docs/design-system.md` §Components, §Tokens (accent)
- `docs/ux-guidelines.md` §States (disabled)

## Done

- [x] Toggle in `packages/ui` with native input, token-colors, disabled
- [x] Unit tests; no hex in screen code
- [x] "Native input" convention fixed in design-system.md
