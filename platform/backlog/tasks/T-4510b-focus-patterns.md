# T-4510b · Focus patterns: focus-visible, focus-trap, skip-link (3/8)

- **Stage**: M1 (phase 3) · **Tags**: frontend, design · **Complexity**: middle · **Dependencies**: T-004, T-4510a
- **StoryPoints**: 3

## What

Keyboard focus as gate: visible `:focus-visible` with tokens (accent) in Button/Select/Field/Table, focus-trap in Modal/Sheet/Dialog (focus return, doesn't escape window), skip-link on site (navigation to content), focus not "monopolized" by tabs. Patterns in `ux-guidelines.md`; implementation — in `@fade/ui` (common hook `useFocusTrap`).

## Why

Modals/shields without trap — classic a11y defect: focus goes behind dialog, reader "loses" user; skip-link critical for screen-reader site navigations. Made in same components that already exist (Modal/Sheet in `@fade/ui`), so this is engineering separate slice from axe-check (it — outside, this — inside).

## Requirement sources

- `docs/ux-guidelines.md` §Accessibility (focus)
- `docs/design-system.md` §Tokens (accent for focus)
- `packages/ui/src/Modal.tsx`, `Sheet.tsx` (focus-trap), `docs/review-checklist.md` §UI

## Done

- [ ] `:focus-visible` with tokens in common components
- [ ] focus-trap in Modal/Sheet/Dialog (exit, return); skip-link on site
- [ ] Unit/e2e tests: tab navigation opens/closes dialog without focus escape
