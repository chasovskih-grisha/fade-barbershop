# T-002a · Infrastructure Dependencies (6/11)

- **Stage**: M0 (phase 0) · **Tags**: infra, devops · **Complexity**: middle · **Depends on**: T-001a
- **StoryPoints**: 6

## What
Create CI-образи: `api`, `web`, `admin` з лінт/типами/теsтами, `packages/ui` компоненти. Configure `design-tokens verify` на PR. Підняти CI pipeline на GitHub Actions.

## Why
Чеклиsт v1: «Trusted Quality». CI — safeguard against regressions перед деплоєм.

## Sources
- `docs/engineering-principles.md` (quality gates, test pyramid)
- `.github/workflows/ci.yml` (template)

## Done
- [x] CI images created
- [x] `design-tokens verify` configured
- [x] CI pipeline set up

## dependencies
- T-002b (deploy-pj)