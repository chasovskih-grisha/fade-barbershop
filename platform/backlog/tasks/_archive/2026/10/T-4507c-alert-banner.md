# T-4507c · AlertBanner (2/8)

- **Stage**: M1 (phase 2) · **Tags**: frontend, design · **Complexity**: junior · **Dependencies**: T-004
- **StoryPoints**: 2

## What

`AlertBanner` in `packages/ui`: error/success/info banner with tokens (resolved from status map), `role="alert"`/`role="status"`, action option (e.g. "Retry" — retry pattern from 16-shared), dismiss. Used in phase 2+ screens (API errors: locations, catalog, calendar).

## Why

Form "banner with error + Retry" — repeated pattern everywhere in admin and flow; separate primitive = consistency and tests. On API failure (network/provider) banner with Retry — only honest state without hard-reload.

## Requirement sources

- `docs/admin/16-shared.md` §Popup errors, §Form Patterns (Retry)
- `docs/design-system.md` §Tokens (status map)
- `docs/ux-guidelines.md` §States (error, empty — adjacent states)

## Done

- [x] AlertBanner in `packages/ui` (variants: error/success/info, action, dismiss)
- [x] `role="alert"`/`role="status"` for correct announcement
- [x] Unit tests (variants, action, closing); `pnpm docs:validate` green

**Result (2026-09-28).** `packages/ui/src/AlertBanner.tsx` + export from index: `tone` error/success/info, `role="alert"` for error (aggressively) and `role="status"` for rest (politely), `action` (`{label, onClick, loading}` — `loading` blocks repeated click, to not multiply requests), `onDismiss` with accessible name "Close message", `children` for arbitrary content; colors and icons from tokens (`@fade/ui` Icon). Test `AlertBanner.test.tsx` — 6 cases (roles, description+action, request blocking, dismiss, no extra buttons). First consumer — public site states (T-4513): `apps/web/.../states/ErrorState.tsx`.
