# T-4507 · Admin Form Primitives: Select, Toggle, AlertBanner, Avatar

- **Stage**: M1 (phase 2) · **Tags**: frontend, design · **Complexity**: middle · **Depends on**: T-004, T-4506
- **StoryPoints**: 8

## What

Extend `packages/ui` with primitives required by phase 2–5 screens but missing in `@fade/ui` (migrated from `docs/admin/16-shared.md` and `docs/design-system.md` §Components): **Select** (dropdown with keyboard navigation and aria), **Toggle** (boolean switch), **AlertBanner** (API error/success banners, `role="alert"/"status"`, Retry), **Avatar** (photo/initials fallback). Each built from tokens, states (loading/empty/error/disabled/focus), unit tests, no hex in screen code.

## Why

Admin phase 2+ (T-020, T-045, T-046, T-111) builds tables with filters, activity toggles, API error banners, and avatars. Without these primitives, the team creates local copies in screens — violating the gate "missing component → `packages/ui`, not local in screen" (AGENTS.md, review-checklist §UI).

## Sources

- `docs/admin/16-shared.md` §Shared UI Components (Select, Toggle, AlertBanner), §Form Patterns (inline validation, Retry), §Popup errors
- `docs/design-system.md` §Components, §Tokens (status colors, accent, radii)
- `docs/ux-guidelines.md` §Accessibility, §States

## Done

- [x] Select, Toggle, AlertBanner, Avatar in `@fade/ui` from tokens and full states
- [x] Form pattern "field + inline error + Retry" in AlertBanner
- [x] Unit tests for each component; `pnpm docs:validate` and `pnpm lint` green
- [x] Phase 2 screens (T-020/T-045) use components, not local copies

## Risks

- [ ] Select grows into a full combobox (multi-select, search) — not needed for v1, keep simple (scope in T-4507a)

## Breakdown (Slices, 8 SP)

1. **Select** *(middle, 2 SP)* — most complex: dropdown, keyboard, aria. Separate Slice due to risk of growing into combobox.
2. **Toggle + Checkbox extensions** *(junior, 2 SP)* — boolean flags with native input.
3. **AlertBanner** *(junior, 2 SP)* — error/success banners with Retry.
4. **Avatar** *(junior, 2 SP)* — photo/initials fallback, placeholder icon from T-4506.
