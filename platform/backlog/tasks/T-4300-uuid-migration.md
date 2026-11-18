# T-4300 · UUID-migration доменних моделей

- **Stage**: M0 (phase 0) · **Tags**: backend, architecture, high-risk · **Complexity**: senior · **Depends on**: T-001, T-002
- **StoryPoints**: 30

## What
migration всіх доменних моделей на UUID v7 як primary key. Create shared kernel з генератором UUID v7, Update Prisma схеми, виконати міграцію існуючих таблиць (expand/contract), Update API контракти, Tests, документацію.

## Why
Глобальна унікальність ID між сервісами/базами/середовищами. Захист від enumeration атак. Merge-friendly дані. Час створення закодований в UUID v7. Client-side генерація ID для optimistic UI.

## Sources
- ADR 0021 (UUID Primary Keys)
- `docs/adr/0021-uuid-primary-keys.md`
- `packages/shared-kernel/src/id.ts`

## dependencies
- T-4300a (генератор UUID у shared kernel)
- T-4300b (оновлення схем Prisma)
- T-4300c (migration наявних таблиць)
- T-4300d (API-контракти і OpenAPI)
- T-4300e (оновлення тестів і фіксчер)
- T-4300f (правила лінтера і CI-гейти)

## Implementation plan

Paths:
- apps/api/src/catalog
- apps/api/prisma/schema.prisma

Checks:
- pnpm uuid:check

## Implementation notes

- apps/api/prisma/schema.prisma

## QA

- `pnpm uuid:check` exit 0
