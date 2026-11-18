# ADR 0021: UUID Primary Keys for Domain Models

## Status
Accepted

## Context
All domain models (aggregates, entities) must use UUID v7 (time-ordered) as primary keys instead of auto-incrementing integers. This applies to:
- All aggregate roots
- All entities within aggregates
- All read models / projections
- All event store records
- All foreign keys referencing domain models

**Exclusions**: Pure infrastructure tables (migration logs, queue jobs, cache entries) may use integer IDs.

## Decision
1. **UUID v7** (RFC 9562) — time-ordered, 128-bit, 48-bit timestamp + 74-bit random. Better index locality than v4, sortable by creation time.
2. **Generation**: Application-side (not DB default). Use `uuidv7()` from `uuid` package or equivalent.
3. **Storage**: PostgreSQL `uuid` type (16 bytes). Index with `uuid_generate_v7()` for server-side if needed.
4. **API**: Always expose as string (standard UUID format `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).
5. **Migration**: New tables use UUID from start. Existing integer PK tables — create UUID column, backfill, switch PK, drop integer (zero-downtime via expand/contract).

## Consequences

### Positive
- **Global uniqueness** across services, databases, environments — no collision risk in distributed systems
- **No enumeration attacks** — clients cannot guess IDs to probe resources
- **Merge-friendly** — no PK conflicts when merging data from multiple sources/shards
- **Audit-friendly** — creation time encoded in UUID v7 (sortable)
- **Client-side generation** — no round-trip to DB for ID, enables optimistic UI

### Negative
- **Storage overhead** — 16 bytes vs 4/8 bytes (negligible for most tables)
- **Index size** — larger B-tree (mitigated by v7 time-ordering)
- **Debugging** — less readable than integers (mitigated by tooling)
- **Migration effort** — existing integer PK tables need careful migration

## Implementation Checklist
- [ ] Add UUID v7 generator to shared kernel (`packages/shared-kernel/src/id.ts`)
- [ ] Update Prisma schema generator to use `uuid` type with `@default(uuid())` for new models
- [ ] Create migration script template for integer→UUID conversion
- [ ] Update all domain model base classes (`Entity`, `AggregateRoot`) to use `UUID` value object
- [ ] Add lint rule: forbid `@@id([id])` with `Int` / `@default(autoincrement())` on domain models
- [ ] Update API contracts (OpenAPI) to document UUID format
- [ ] Update integration tests to use UUID fixtures

## References
- RFC 9562 (UUID v7)
- [UUID v7 benefits](https://www.ietf.org/archive/id/draft-peabody-dispatch-new-uuid-format-04.html)
- ADR 0002 (Modular Monolith) — domain isolation requires global uniqueness
- ADR 0020 (Assistants) — event store needs globally unique IDs