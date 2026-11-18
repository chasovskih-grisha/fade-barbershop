# T-4512 · Marketing consolidation: sort out apps/marketing

- **Stage**: M1 (phase 3) · **Tags**: frontend, infra, design · **Complexity**: middle · **Dependencies**: T-030, T-4508
- **StoryPoints**: 5

## What

`apps/marketing` currently duplicates public web pages as mock-copies and doesn't participate in CI (separate workspace, no tests and coverage-matrix). Decide app fate:
- Option A (recommended): **merge marketing into web** — public surface single (T-030 + T-4508), marketing pages (landing, social proof, partners) become web route parts and blog feed; remove separate app
- Option B: leave marketing showroom only as statically-exported mini-landing outside system, with explicit boundaries (not component-backlog)

Choose option, fix decision, execute. `backlog/coverage-matrix.md` already got row for marketing surface 2026-09-24; after implementation row updated (or marked "merged into web").

## Why

Double public surface outside CI creates untestable third "truth" about how product looks on market. Design system must have one canonical surface per role; mirrors spread. Before v1 promotion decision needed in advance (before M4).

## Requirement sources

- `apps/marketing/` (state as of inventory)
- `backlog/coverage-matrix.md` (no marketing row → coverage invariant broken)
- `docs/design-system.md` §Shells (one surface per role)
- `docs/roadmap.md` (v1 promotion, marketing)

## Done

- [x] Option chosen and documented (A/B)
- [x] Marketing content moved to web (A) or fixed separate showroom boundaries (B)
- [x] `coverage-matrix.md` actual; `pnpm docs:validate` green

**Decision (2026-09-28): option A.** Chosen to merge into `web` and remove separate app. Arguments: (1) all six `apps/marketing` pages — copies of `web` public pages with mocks, no unique content there (checked file by file); (2) public surface single — design system requires one surface per role, and CI-outside mirror creates untestable "third truth"; (3) T-4508 already fixed canonical web-shell, so "landing/social-proof/partners" into separate app after consolidation nothing to transfer — these are separate sections/routes `web` (T-030/T-031) by current needs.

**Done:** `apps/marketing/` removed (19 files), importer removed from `pnpm-lock.yaml` (`pnpm install --lockfile-only`), `marketing` row removed from `backlog/coverage-matrix.md`, in apps directory remained `web`/`admin`/`mobile`/`api`. No references to app in code, configs or docs except backlog. `pnpm typecheck`, `pnpm --filter web build` and `pnpm docs:validate` — green.

**Question remaining outside:** "marketing" pages (landing, social proof, partners) not transferred to code — their content wasn't in `marketing`; they live in content/brand (`00-brief/`, `brand/`) and hooked to site together with T-030/T-031 by current need.

## Risks

- [x] Content transfer drags — content without business logic, transferred "as is" with tokens (not needed: nothing to transfer)
