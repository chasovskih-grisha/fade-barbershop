# T-4615a · Catalog Module instead of Empty Folder

- **Stage**: M1 (phase 2) · **Tags**: backend, architecture · **Complexity**: middle · **Depends on**: T-024
- **StoryPoints**: 8

## What

Move working code from `apps/api/src/services/` to `apps/api/src/catalog/` so that plan and code match.

- Aggregate, use cases, Prisma adapter, and controllers live in `catalog`. After migration, the `services` folder contains no second aggregate: either it is absent, or it only re-exports `catalog` and tests fail if a new `Service` is added there.
- HTTP paths do not change: `/admin/services`, location prices, public menu reading.
- Catalog README describes files that actually reside nearby, not a neighboring module.
- Imports from `scheduling` and admin point to `catalog`. Pricing behavior is not changed by this slice.

## Why

An empty `catalog` and an active `services` folder are two places where a future price change might land in only one. While they are split, ADR 0006 has nothing to attach to in the catalog code.

## Sources

- T-4615; `apps/api/src/catalog/README.md`; ADR 0019 (file shorter than 100 lines, layout across folders as is)
- ADR 0002 (single context module in monolith)

## Done

- [ ] No second `Service` class outside `catalog`
- [ ] Existing service tests pass from the new location
- [ ] No public URL is renamed
- [ ] Catalog README matches the file tree

## Risks

- [ ] **Circular import** via re-export. If the `services` folder remains, it does not import what imports it
- [ ] **Confusion with T-024.** This slice moves code. Price rules are not rewritten

## Demarcation

- JSON booking menu — **T-4615b**
- Amount change and warnings in admin — **T-024**
