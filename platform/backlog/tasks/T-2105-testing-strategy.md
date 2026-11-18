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
