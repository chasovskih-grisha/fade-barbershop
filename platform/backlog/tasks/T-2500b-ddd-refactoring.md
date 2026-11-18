# T-2500b · DDD Refactor (8/40)

- **Stage**: M6 (phase 40) · **Tags**: backend, architecture, ddd · **Complexity**: senior · **Depends on**: T-004, T-012, T-021
- **StoryPoints**: 8

## What
Migrate domain logic to DDD: Create contexts `booking`, `customers`, `barbers`, `loyalty`. Add aggregates, entities, value objects, events. Clean infrastructure code from domain objects.

## Why
DDD ensures clear boundaries of responsibility. Aggregates protect invariants. Events for integration. Without DDD, code becomes tangled.

## Sources
- ADR 0010 (DDD)
- docs/ddd.md — phantom 2026-09-22: file never existed; source accepted at task start
- Test data from T-2104a

## Done
- [ ] Contexts defined
- [ ] Aggregates created
- [ ] Events added
