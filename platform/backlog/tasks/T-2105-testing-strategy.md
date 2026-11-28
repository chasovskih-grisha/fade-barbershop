# T-2105 · Comprehensive Testing Strategy (15 SP)

- **Stage**: horizontal · **Tags**: quality, devops · **Complexity**: senior · **Depends on**: T-301, T-302
- **StoryPoints**: 15

## What
Create testing strategy: unit tests >80% coverage, integration tests, E2E tests for critical flows, contract tests, error testing, continuity (chaos) testing. CI must reject coverage drops.

## Why
Prevent regressions before releases. Error testing to properly display issues to clients. Continuity testing to confirm service stability.

## Sources
- `docs/engineering-principles.md` (test pyramid, CI coverage gates — api ≥ 85% lines)
- `docs/booking-flow-tests.md` (GWT scenarios as basis for e2e)
- T-301 (GWT automation), T-132 (v1 test pass)

## Done

- [ ] Written strategy covers unit/integration/e2e/contract/error/chaos layers, ownership, flake policy, and release gates
- [ ] CI rejects coverage drops at the agreed thresholds
- [ ] A real continuity/chaos scenario runs and its result is recorded, not only `docker compose config`
- [ ] The strategy is linked from `docs/engineering-principles.md` and referenced by the affected task gates

## Audit 2026-11-24

Reopened. `infra/chaos/testing-strategy.sh` is a stub that prints a sentence and
runs `docker compose config`; no strategy document exists, and T-2105 is not
referenced from the engineering principles or CI. The existing script proves only
that the Compose file parses.

## Implementation plan

Paths:
- infra/chaos/testing-strategy.sh

Checks:
- docker compose -f infra/docker-compose.yml config

## dependencies
- Slices within task: unit strategy → e2e strategy → coverage monitoring in CI

## Implementation notes

- infra/chaos/testing-strategy.sh

## QA

- `docker compose -f infra/docker-compose.yml config` exit 0
