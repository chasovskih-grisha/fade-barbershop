# T-4300f · Linter and CI Gate "UUID only" (4/30)

- **Stage**: M0 (phase 0) · **Tags**: backend, devops, architecture · **Complexity**: middle · **Depends on**: T-4300a
- **StoryPoints**: 4

## What

A gate that prevents ADR 0021 policy from eroding: ESLint rule (prohibiting `crypto.randomUUID`/`uuid.v4` in domain layers — shared kernel `uuidv7()` only), CI grep gate against `@default(autoincrement())` and `Int @id` in Prisma schemas. Pattern — similar to design hex gate (T-004) and LOC limit (ADR 0019).

## Why

A policy without a gate lives for one sprint. Automated checking is cheaper than review reminders.

## Sources

- ADR 0021; `docs/engineering-principles.md` (quality gates); CI gate pattern (T-001/T-004)

## Done

- [x] ESLint rule + test for it (attempting violation = red lint)
- [x] CI step: grep gate for autoincrement in `*.prisma` — red on violation
- [x] Rule documentation in engineering-principles.md §UUID Keys

## Risks

- [x] **False positives**: service tables of the outbox log — solution: either UUID too, or allowlist in gate config
  (вирішено: `AppSetting` — у `PRISMA_PK_ALLOWLIST` з причиною; тестові двійники й сіди — поза гейтом)
