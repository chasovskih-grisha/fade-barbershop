# T-4407 · Conventional commits + changelog auto-generation

- **Stage**: M0 (phase 0) · **Tags**: devops, infra · **Complexity**: middle · **Depends on**: T-001, T-002
- **StoryPoints**: 5

## What

Git-level release discipline: commitlint + conventional commits as CI gate, pre-commit hook, auto-generation of `CHANGELOG.md` and release tags from semantic versioning (fix/feat/breaking), unified commit template in AGENTS.md.

## Why

The first 100+ commits are already in the repository (refinement logs show: `feat`/`fix`/`docs` are flying chaotically); without a release notes convention, the duration of `git log --oneline` becomes noise, and the changelog becomes a manual.

## Sources

- engineering-principles.md (quality gates); T-4205 (SBOM/tag in CI — consumer)

## Done

- [x] commitlint gate in CI (fail-fast on non-conforming messages) works
- [x] `pnpm changelog` generates CHANGELOG.md from pre-commit hook
- [x] Agent rules AGENTS.md updated (commit format)

## Risks

- [ ] **Rewriting new commits**: strives for "new", we do not rebase old branches
