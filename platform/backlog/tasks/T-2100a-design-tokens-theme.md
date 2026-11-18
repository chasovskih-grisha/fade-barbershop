# T-2100a · Design Tokens and Theme (5/20)

- **Stage**: M5 (phase 30) · **Tags**: design · **Complexity**: middle · **Depends on**: T-004
- **StoryPoints**: 5

## What
Audit and update of design tokens: colors, typography, spacing, border radii, shadows, transitions. Add dark mode for admin panel and mobile app. Verify color contrast (WCAG AA).

## Why
Tokens are the foundation of consistency. Dark mode is a user and accessibility requirement. Contrast is for a11y.

## Sources
- `docs/design-system.md` §Tokens
- docs/design-direction.md — phantom 2026-09-22: file never existed; source accepted at task start
- `packages/design-tokens/tokens.json`

## Implementation plan

Paths:
- packages/design-tokens/tokens.json

Checks:
- node packages/design-tokens/contrast.mjs

## Done
- [x] Tokens updated
- [x] Dark mode added
- [x] Contrast check passed

## Implementation notes

- packages/design-tokens/dist/tokens.js
- packages/design-tokens/tokens.json

## QA

- `node packages/design-tokens/contrast.mjs` exit 0
