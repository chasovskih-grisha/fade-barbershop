# T-2101c · Admin Panel Audit and Refinement

- **Stage**: M5 (phase 31) · **Tags**: admin, frontend, audit · **Complexity**: middle · **Depends on**: T-2100, T-020
- **StoryPoints**: 3

## What

Comprehensive audit of admin panel screens against design specifications and accessibility guidelines. Refinement of UI components, form validations, and error states.

## Why

Ensures the admin panel provides a polished, consistent, and efficient user experience for staff and managers.

## Sources

- `docs/admin-screens.md`
- `docs/review-checklist.md`

## Done

- [ ] Admin screens audited against specs
- [ ] UI inconsistencies and form validation bugs fixed
- [ ] Accessibility check passed

## Risks

- [ ] **Scope creep**: uncovering numerous minor UI issues during audit.

## Status

- 2026-11-20: source audit written — `docs/admin-ui-audit-2026-11.md`. Measured, not
  estimated: 27 screens, 14 files over 100 LOC, 1 hex and 15 `px` literals, 17 files with
  `focus-visible`, 31 files with an `<input>` and no `aria-invalid`, 2 `aria-live`
  regions, 0 `loading.tsx`, 2 `error.tsx`. Three findings with owners already in the
  index: missing skeletons (T-4513), no error announcements (T-4510a/T-4507), local
  controls instead of `packages/ui` (T-4507). No screen was opened in a browser and no
  fix was made — this slice is the audit, not the polish.
