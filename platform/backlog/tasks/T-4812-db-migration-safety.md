# T-4812 · Automated Database Migration Safety & Rollback Validation in CI

- **Stage**: M0 · **Tags**: backend, database · **Complexity**: senior · **Depends on**: T-001, T-002
- **StoryPoints**: 5

## What

Implement automated CI validation checks for Prisma database migrations to ensure zero-downtime deploy compatibility (checking for breaking schema changes like dropping columns without deprecation cycles) and test rollback safety.

- CI check validating migration SQL files for unsafe operations (e.g. adding non-null columns without default values).
- Staging staging-to-production migration dry-run test suite.

## Why

Prevent catastrophic production outages caused by incompatible database migrations or unhandled schema changes during zero-downtime rolling deployments.

## Sources

- `platform/docs/architecture.md`, `platform/docs/engineering-principles.md`
- `platform/docs/seeding.md`

## Done

- [ ] CI migration linter script checking Prisma migration SQL files for breaking patterns
- [ ] Automated dry-run migration test container executed on every pull request
- [ ] Documentation update in engineering principles regarding zero-downtime migration patterns

## Risks

- [ ] **Prisma limitations**: Handling complex data type alterations that require multi-step migration phases.
