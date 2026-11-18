# T-4521a · Matrix Model and Slot Filter (4/8)

- **Stage**: M1 (phase 2) · **Tags**: backend, architecture · **Complexity**: middle · **Depends on**: T-040, T-024
- **StoryPoints**: 3

## What

`BarberService` in the catalog context: (`barberId`, `serviceId`, `locationId`, `categoryId×null`). Default of an empty matrix — "barber performs all active services of the location". Rating mechanics for slots (T-040): generation of barber slots proceeds only for services in the matrix; "Any Barber" refines the list of candidates by the selected service. Father-son (T-044) — two barbers with overlapping service intersections.

The availability domain knows nothing about specialization — only active/inactive barber. Catalog matrix without modifying scheduling aggregates: slots query catalog for validity (`serviceId`, `barberId`). This is the cheapest entry point for flexibility.

## Why

Without a matrix, any barber can perform any service, which contradicts reality (junior barbers do not perform complex beard styling or specific coloring). Hardcoding this in scheduling breaks bounded contexts; catalog is the correct owner of service-staff bindings.

## Sources

- `apps/api/src/scheduling/README.md` (availability, slots)
- `docs/booking-flow.md` §Screen 2, §"Any"
- `docs/bounded-contexts.md` (catalog vs scheduling)

## Done

- [ ] `BarberService` entity/relation added to catalog module
- [ ] Availability engine queries catalog for barber service eligibility before slot generation
- [ ] "Any Barber" aggregation respects service matrix filtering
- [ ] Unit tests for matrix filtering (barber performs subset of location services)

## Implementation plan

Paths:
- apps/api/src/scheduling/domain/barber-service-matrix.ts
- apps/api/src/scheduling/domain/barber-service-matrix.spec.ts

Checks:
- pnpm --filter @fade/api exec jest src/scheduling/domain/barber-service-matrix.spec.ts

## Risks

- [ ] **Query performance**: checking eligibility per slot generation step must be optimized or cached.
