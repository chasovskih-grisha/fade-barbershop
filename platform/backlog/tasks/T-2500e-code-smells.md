# T-2500e · Elimination of code smells (8/48)

- **Stage**: M6 (phase 40) · **Tags**: backend, quality · **Complexity**: senior · **Depends on**: T-2500a
- **StoryPoints**: 8

## What

Slice 5/6 of parent T-2500: final pass over the list of smells from T-2500a — long functions, magic values, missing interfaces. Each fix is a small PR with tests.

## Why

Final hygiene after structural changes (DDD/SOLID/DRY): removes what remained after major refactoring.

## Sources

- `docs/review-checklist.md`
- List of smells from T-2500a

## Done

- [ ] List of T-2500a smells closed or each remaining item has a decision comment
- [ ] Lint gates (max-lines ≤100, max-params ≤3) green without exceptions
- [ ] No drop in coverage

## dependencies

- T-2500f (global JS/TS and ESLint refactoring)
