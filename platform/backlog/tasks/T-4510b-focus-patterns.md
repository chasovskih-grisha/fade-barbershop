# T-4510b · Focus patterns: focus-visible, focus-trap, skip-link (3/8)

- **Stage**: M1 (phase 3) · **Tags**: design · **Complexity**: middle · **Dependencies**: T-004, T-4510a
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

- [x] `:focus-visible` with tokens in common components
- [x] focus-trap in Modal/Sheet/Dialog (exit, return); skip-link on site
- [x] Unit/e2e tests: tab navigation opens/closes dialog without focus escape

### Re-verified at 1be4bd70 (2026-11-27)

All three Done items are already in the tree; the row was stale at `todo`:

- **focus-visible with tokens.** `focus-visible:ring-2 focus-visible:ring-accent-blue` (accent token, no hex)
  is present in the interactive `@fade/ui` components: `Button`, `Select`, `TextField`, `PhoneInput`,
  `OtpInput`, `Checkbox`, `Tabs`, `Dialog`, `Toggle`, `Toast`, `Calendar`, `SlotPicker`. `Field` and `Table`
  have no focusable element of their own (Field wraps `children`; Table cells are not focusable), so the
  token lives on the actual controls.
- **focus-trap.** `useDialogBehavior` (`packages/ui/src/useDialogBehavior.ts`) traps Tab/Shift+Tab, closes
  on Escape, sets initial focus inside the panel and returns focus to the trigger. `Modal` and `Sheet`
  both render through `Dialog`, so all three surfaces inherit the trap.
- **skip-link.** `apps/web/src/app/components/shell/PublicShell.tsx:20` renders the `#main` skip-link.
- **tests.** `packages/ui/src/Dialog.test.tsx` has 8 cases including `зациклює Tab з останнього на перший`,
  `зациклює Shift+Tab з першого на останній`, no-intercept inside the panel, Escape close, and focus
  return to the trigger.

Left in `review` (not `done`): the parent `T-4510a` is still `in_progress`.
