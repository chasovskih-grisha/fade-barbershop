# T-001 · Monorepo and Application Scaffolding

- **Stage**: M0 (phase 0) · **Tags**: infra, devops · **Complexity**: senior · **Depends on**: none (first task)
- **StoryPoints**: 13

## What

Create monorepo and application scaffolds according to ADR 0003 (TypeScript: Nest + Next + Expo):

- `apps/api` — NestJS, modular monolith (ADR 0002); bounded context structure (`src/<context>/domain | application | infrastructure`) following context README conventions: domain does not import Nest/Prisma/HTTP, dependencies inward.
- `apps/web` — Next.js (SSR), `apps/admin` — Next.js, `apps/mobile` — Expo (single binary, client/barber roles — ADR 0004).
- Shared packages (types, lint config) — `packages/`; inter-context events — outbox infrastructure in `apps/api`.

## Why

Foundation of all phases; context convention documented in `apps/api/src/*` README and checked from day one, not post-facto.

## Sources

- `docs/architecture.md`, ADR 0002 (monolith), ADR 0003 (stack), ADR 0004 (single mobile app)
- Context READMEs `apps/api/src/*/` (layering, ports, events)
- `docs/engineering-principles.md` (strict constraints), ADR 0019 (file limit)

## Done

- [x] 4 application scaffolds start locally with a single command (`pnpm dev`)
- [x] First context layer (`identity` stubs) follows layering convention
- [x] Linter and types run across monorepo without errors
- [x] Quality gates from `engineering-principles.md` in linter config: max-lines 100 (exceptions: generated, `*.d.ts`, snapshots), complexity ≤ 10, max-params ≤ 3 — violation = red build
- [x] Test runner and CI coverage gates configured (api ≥ 85% lines / ≥ 80% branches; domain and application ≥ 90%)
- [x] Bounded context structure `apps/api/src/*/` matches context README conventions
- [x] Monorepo pass-rate = 100% (all apps start locally)

> Implemented 2026-09-21: 17 contexts with layers `domain | application | infrastructure` (`identity` — stubs, rest — scaffold); `pnpm lint/typecheck/build/test` green; coverage gates in jest + CI. Local ports shifted to unique block (api 13000, web 13001, admin 13002, Metro 18081), since 3000/3001 are taken by other projects; API `dev` — webpack (bypassing stale `tsconfig.tsbuildinfo`). Dockerfiles `infra/{api,web,admin}.Dockerfile` and `apps` profile active (ADR 0018).

## Risks

- [ ] **Complexity setup**: Potential issues with ESLint/TypeScript configuration in monorepo
- [ ] **Package dependencies**: Risk of circular dependencies between apps and packages
- [ ] **Layering convention**: Hard to maintain convention from day one without automated checks
