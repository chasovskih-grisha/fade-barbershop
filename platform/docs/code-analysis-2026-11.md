# Code analysis and smell register — 2026-11-19

Deliverable of T-2500a (analysis slice of the T-2500 refactor epic). Scope: static
analysis, lint, typecheck and a manual pass over the four code workspaces and the two
shared packages. The output is the prioritised smell list that T-2500b–f work from; it
is a register, not a plan.

Sources: `package.json` (lint/typecheck scripts), `docs/engineering-principles.md`
§Code smells and refactoring policy, `docs/review-checklist.md` §0–§4, ADR 0019
(file LOC < 100, cyclomatic complexity ≤ 10, function params ≤ 3), ADR 0055
(`*Request` / `*Response` / `*Payload` instead of `*Dto`).

## How the numbers were taken

Read-only greps over the tree at `stage` (`202a8f83`), specs excluded unless stated.
`ADR 0019` thresholds are the gate; a hit below a threshold is still recorded when it
is a *cause* the gate cannot see (duplication, layering, naming).

```
find <ws> -name '*.ts' -o -name '*.tsx' | grep -v '\.spec\.\|\.test\.' | xargs wc -l
grep -rn 'eslint-disable' apps packages --include=*.ts --include=*.tsx
grep -rn 'as any\b' apps packages --include=*.ts --include=*.tsx
grep -rn 'Math.round([^)]*\* *100) *\/ *100' apps/api/src --include=*.ts
grep -rn 'class .*Dto\b\|interface .*Dto\b' apps/api/src packages/contracts/src
grep -rn 'switch (' apps/api/src --include=*.ts
grep -rln '@nestjs\|@prisma' apps/api/src/*/domain --include=*.ts
```

## Gate state (ADR 0019)

| Workspace | Source files | Files over 100 LOC | Share |
|-----------|-------------:|-------------------:|------:|
| `apps/api/src` | 950 | 111 | 11.7 % |
| `apps/web/src` | 267 | 43 | 16.1 % |
| `apps/admin/src` | 228 | 31 | 13.6 % |
| `apps/mobile/src` | 85 | 8 | 9.4 % |
| `packages/ui/src` | 46 | 2 | 4.3 % |
| `packages/contracts/src` | 5 | 1 | 20 % |

The gate is red repo-wide and predates this analysis. The register below is ordered by
*repair cost × blast radius*, not by raw count.

## P1 — layering and naming (highest blast radius)

1. **`*Dto` suffixes survive in 20 files / 37 declarations.** ADR 0055 renamed the
   boundary types to `*Request` / `*Response` / `*Payload`, and
   `docs/dto-rename-map.md` tracks the mapping, but the old names are still the
   majority in `identity/infrastructure/profile-dto.input.ts` (4),
   `locations/infrastructure/admin-locations.dto.ts` (5),
   `identity/infrastructure/admin-barbers.dto.ts` (4) and `booking/dto/*` (8 files).
   Cause: the rename landed in `scheduling` and stopped. Fix: finish the map
   context by context, one PR per context, with the map row deleted as it is closed.
   Owner: T-2500b (DDD) with the identity/locations slices first.
2. **`dto/` directories persist** next to the renamed `infrastructure/` folders in
   `apps/api/src/booking/dto` and `apps/api/src/scheduling/dto`. Two layouts for the
   same job is the smell; the folder goes when the last file in it is renamed.

Layering itself is clean: **no file in `apps/api/src/*/domain` imports `@nestjs` or
`@prisma`** (0 hits). Keep that invariant as the first check of any domain change.

## P2 — duplication with a single domain cause

3. **Money rounding is re-implemented 12 times in 8 files**
   (`Math.round(x * 100) / 100`): `billing/application/retrieve-invoice.use-case.ts`,
   `billing/infrastructure/stripe-acquiring.gateway.ts`,
   `scheduling/domain/peak-surge-pricing-optimizer.ts`,
   `scheduling/domain/dynamic-surge-pacing-optimizer.ts`,
   `scheduling/domain/barber-turnover-analytics.ts`,
   `scheduling/domain/barber-break-optimizer.ts`,
   `scheduling/domain/smart-capacity-payout-optimizer.ts`,
   `catalog/domain/revenue-yield-booster.ts`. One of them (`retrieve-invoice`) hard-codes
   the 20 %/80 % VAT split next to it. Cause: the shared kernel has `domain/` but no
   money helper. Fix: one `roundMoney` (and `vatSplit`) in `shared/domain`, then the
   12 sites. Owner: T-2500d (DRY). Test first: a `shared/domain` unit spec, then the
   existing per-domain specs must stay green without assert edits.
4. **`Math.round(x * 100) / 100` is also used as a "percent" rounder** in
   `revenue-yield-booster.ts:86` and `barber-break-optimizer.ts:90` — a rate, not
   money. Do not fold those two into `roundMoney`; give them `roundRate`. Mixing them
   is how a rounding fix turns into a pricing bug.

## P3 — size and complexity

5. **`apps/mobile/src/app/(client)/waitlist/WaitlistClientScreen.tsx` — 1453 LOC.**
   The largest file in the tree by 2×. It already carries
   `/* eslint-disable max-lines */`, so the gate is suppressed, not met. Split by
   screen region (list, filter sheet, join form, empty state), each < 100 LOC, keep
   the container as composition only. Owner: T-2500c (SOLID).
6. **`apps/web/src/app/support/page.tsx` — 697 LOC** with its own test file, so it can
   be split safely. Then `apps/api/src/catalog/domain/revenue-optimization.ts` — 755
   LOC, has `revenue-optimization.spec.ts`, and is pure domain: the cheapest large file
   to break up.
7. **`packages/ui/src/Select.tsx` — 179 LOC with `/* eslint-disable complexity,
   max-lines */` at line 1.** A design-system primitive that opts out of both gates is
   the worst place for an exemption: every screen inherits it. Owner: T-2500c. The
   `Avatar.tsx` single-line `complexity` suppression is the same pattern at smaller
   scale.
8. **Remaining `complexity` suppressions**: `web/booking/steps/LocationStep.tsx:21`,
   `api/catalog/application/update-service.ts:29`,
   `api/catalog/infrastructure/admin-services.controller.ts:72`. Each needs either a
   decomposition or a written justification beside it (review-checklist §0 forbids
   silent suppressions); today only `redis-slot-lock.spec.ts` carries a reason.

## P4 — hygiene

9. **`eslint-disable` total: 28.** 22 are `next-line`, 6 are block. The block ones are
   all `max-lines` on mobile screens and one test. `no-console` accounts for 6 in
   `apps/api/src` (`content.exception-filter`, `outbox-dispatcher`,
   `locations.exception-filter`, `ai-generation.worker`, `outbox-live-watcher`,
   `seed-logger`): they log where a `Logger` port exists. Low risk, mechanical.
10. **`as any` / `as unknown as`: 43 hits.** Not a gate, but each is a place where a
    boundary type was not modelled. Triage by context; do not bulk-replace.
11. **5 `require(...)` in `apps/api/src`** (`rate-limit.module`, `daily-file.logger`,
    `seed-logger`, `email-tokens`, `slot-lock.providers`) each with a
    `no-var-requires` suppression — a lazy-import workaround. Replace with `await
    import()` where the module is genuinely conditional.
12. **One screen still has hex colours**: `apps/web/src/app/waitlist-analytics/page.tsx`
    (chart palette `#8884d8`, `#3B82F6`, `#8B5CF6`, `#10B981`, `#EF4444`). The rest of
    `web`/`admin` is token-only. Chart series need tokens added to
    `packages/design-tokens` first, then the palette maps to them.
13. **`switch (` appears 10 times in `apps/api/src`** outside specs. Most are on a closed
    value object and fine; `ai-booking-assistant.use-case.ts` and
    `t-181-admin-waitlist-analytics-export.use-case.ts` use `switch` to select work,
    which review-checklist §2 forbids — those are candidate handlers, not new `case`s.

## Clean — do not touch

- Domain layer imports no Nest/Prisma/HTTP (0 hits).
- `console.log` in `apps/api/src` outside specs: 1.
- `packages/contracts/src` is 5 files; its single over-100 file is `identity.ts` (127
  LOC) and is a flat type map — splitting it would scatter one contract.

## Order of work handed to the slices

| Slice | First three items from this register |
|-------|--------------------------------------|
| T-2500b (DDD) | P1-1 identity, P1-1 locations, P1-2 `dto/` folders |
| T-2500c (SOLID) | P3-5 waitlist screen, P3-7 `Select.tsx`, P3-6 `revenue-optimization.ts` |
| T-2500d (DRY) | P2-3 `roundMoney`, P2-4 `roundRate`, P4-12 chart palette |
| T-2500e (smells) | P3-8 suppressions, P4-9 `no-console`, P4-11 `require` |
| T-2500f (ESLint) | re-enable `max-lines` on mobile, drop blanket `complexity`/`max-lines` in `packages/ui` |

Each item closes only with its tests green and the gate (LOC/complexity/params) no
longer suppressed at that site. Items that turn out to be too large get their own
slice file in `backlog/tasks/` before work starts.
