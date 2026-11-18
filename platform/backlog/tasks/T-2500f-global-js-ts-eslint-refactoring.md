# T-2500f · Global JS/TS and ESLint Refactoring (8/40)

- **Stage**: M6 (phase 40) · **Tags**: backend, frontend, quality · **Complexity**: senior · **Depends on**: T-2500a
- **StoryPoints**: 8

## What
Global refactoring of code quality technical debt across the entire monorepo: Fix all JS errors and ESLint warnings/errors in all packages; shorten and optimize imports (remove redundant paths, use aliases where configured); resolve `TS2552` (cannot assign to read-only property) and all other `TS*` warnings and errors; improve type safety — replace `any` with concrete types or generics; find and fix systemic code smells, unify code patterns between `packages/ui`, `packages/domain-shared`, and other platform modules.

## Why
Zero linter and typecheck errors — ADR 0019 gate from day one. Typing debt masks real bugs and slows down reviews.

## Sources
- `docs/engineering-principles.md` (ADR 0019): strict linter gates
- `docs/review-checklist.md`

## Dependencies
- Part of epic T-2500 (see T-2500a…T-2500e)

## Checklist
- [ ] `pnpm lint` passes without errors and warnings
- [ ] `tsc --noEmit` passes without errors
- [ ] No remaining `TS2552` and similar typing warnings
- [ ] `any` replaced with concrete types/generics in hot modules
- [ ] Imports shortened, aliases used according to configuration
- [ ] Code style matches project conventions
