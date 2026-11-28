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

- [x] `BarberService` entity/relation added to catalog module — `BarberServiceAssignment` (`apps/api/prisma/schema.prisma`), порт `scheduling/domain/ports.barber-service-assignment.ts` + `PrismaBarberServiceAssignmentRepository`.
- [x] Availability engine queries catalog for barber service eligibility before slot generation — `booking/infrastructure/available-slots.ts:64` бере снапшот матриці один раз на запит, `available-slots-helpers.ts` фільтрує `serviceBarbers()`.
- [x] "Any Barber" aggregation respects service matrix filtering — `booking/infrastructure/booking.reader.ts:55` (`filterByService`) звужує список кроку 2 і `anyAgg` у слотах; прямий `POST /booking/bookings` теж перевіряється (`scheduling/domain/barber-service-guard.ts`, 422).
- [x] Unit tests for matrix filtering (barber performs subset of location services) — `barber-service-matrix.spec.ts` (4 кейси: призначені, порожня матриця, жоден не виконує, підмножина).
- [x] Father-son (T-044): барбери зі спільною послугою — `barbersOutsideService()` у тому ж домені, `CreateAppointmentParty` перевіряє матрицю перед збереженням партії, `toPartyHttpError` віддає 422; spec `appointment-party-eligibility.spec.ts` (6 кейсів через реальний use-case).

## Implementation plan

Paths:
- apps/api/src/scheduling/domain/barber-service-matrix.ts
- apps/api/src/appointment-party/application/create-appointment-party.use-case.ts
- apps/api/src/appointment-party/appointment-party.module.ts
- apps/api/src/appointment-party/infrastructure/appointment-party-guards.ts
- apps/api/src/appointment-party/application/appointment-party-eligibility.spec.ts

Checks:
- pnpm --filter @fade/api exec jest apps/api/src/appointment-party/application/appointment-party-eligibility.spec.ts --forceExit
- pnpm --filter @fade/api exec jest apps/api/src/scheduling/domain/barber-service-matrix.spec.ts --forceExit

## Risks

- [ ] **Query performance**: checking eligibility per slot generation step must be optimized or cached.

## Implementation notes

- apps/api/src/appointment-party/application/appointment-party-eligibility.spec.ts
- apps/api/src/appointment-party/application/create-appointment-party.use-case.ts
- apps/api/src/appointment-party/appointment-party.module.ts
- apps/api/src/appointment-party/infrastructure/appointment-party-guards.ts
- apps/api/src/scheduling/domain/barber-service-matrix.ts

## QA

- `pnpm --filter @fade/api exec jest apps/api/src/appointment-party/application/appointment-party-eligibility.spec.ts --forceExit` exit 0
- `pnpm --filter @fade/api exec jest apps/api/src/scheduling/domain/barber-service-matrix.spec.ts --forceExit` exit 0
