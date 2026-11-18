# T-4511 · Web: unit tests ≠ e2e (jest↔Playwright isolation) + visual regression base

- **Stage**: M1 (phase 3) · **Tags**: frontend, quality, design · **Complexity**: junior · **Dependencies**: T-030
- **StoryPoints**: 3

## What

In `apps/web` now `pnpm --filter web test` fails: jest picks up Playwright `e2e/*.spec.ts` as unit tests. Separate configs (jest ignores `e2e/`, Playwright — only its directory), so fast unit run doesn't break on e2e and vice versa. Also fix visual regression skeleton in `@fade/ui`: Playwright screenshot-baseline for key pages (web f3, admin f2 shell) with diff threshold in CI.

## Why

"100% coverage" in README doesn't pass actual check (Sheet.tsx and TextField.tsx without tests), and broken web test gate blocks CI for all f3 changes. Visual regression fixes token/spoke assemblies that unit tests don't see. This is prerequisite for honest "all green" on next phases.

## Requirement sources

- `apps/web` (jest config, `e2e/` Playwright)
- `packages/ui/src/Sheet.tsx`, `TextField.tsx` (without tests)
- `docs/review-checklist.md` §UI
- AGENTS.md / `backlog` convention (get-recht about unit tests)

## Done

- [x] `pnpm --filter web test` green and skips e2e specifications
- [x] Tests on Sheet and TextField added; README claim about "100%" will be fact-checked
- [x] Screenshot-baseline in CI for key web/admin pages

## Risks

- [ ] Screenshot tests sensitive in CI without stable container — use existing Playwright setup (not new)
