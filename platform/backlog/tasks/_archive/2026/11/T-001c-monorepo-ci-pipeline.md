# T-001c · CI pipeline (2/11)

- **Stage**: M0 (phase 0) · **Tags**: infra, devops · **Complexity**: middle · **Depends on**: T-001b
- **StoryPoints**: 2

## What
Configure CI на PR: format (prettier) + lint + типи + юніт-Tests + `design-tokens verify` (`pnpm install --frozen-lockfile`). Deploy Pipeline api/web/admin.

## Why
Чеклиsт v1: «Trusted Quality». CI — safeguard against regressions.

## Sources
- `docs/engineering-principles.md` (quality gates, test pyramid)
- `.github/workflows/ci.yml` (template)

## Done
- [x] CI configured (format + lint + типи + Tests + design-tokens verify)
- [x] Deploy pipeline created

## dependencies
- T-002 (infrastructure for prod)
- T-303 (staging/prod deploy)