# T-002 · Infrastructure and CI

- **Stage**: M0 (phase 0) · **Tags**: infra, devops · **Complexity**: senior · **Depends on**: T-001
- **StoryPoints**: 11

## What

- `infra/` (ADR 0018): compose with Postgres + Redis + **MinIO** and three buckets (`haircut-ai-photos`, `feedback-photos`, `media` — ADR 0008/0015), all **explicitly private** (`mc anonymous set none`); api/web/admin Dockerfiles in T-001 (done), `apps` profile active. Prod is managed environment.
- CORS: explicit browser origin allowlist (ADR 0017) — `docs/architecture.md` §CORS, env `CORS_ALLOWED_ORIGINS` in `.env.example` / `infra/.env.docker.example` and in service `api` compose (no `*` — session cookie requires `credentials: true`).
- CI: format (prettier) + lint + types + unit tests + `design-tokens verify` on PR (`pnpm install --frozen-lockfile`); deploy pipeline api/web/admin.
- Domains and SSL per **ADR 0017** (revision 2026-10-01): `fade.com.ua` (showcase and `/booking`), `shop.fade.com.ua`, `admin.fade.com.ua`, `api.fade.com.ua`, `media.fade.com.ua`; CORS api: web hosts. No separate `book` host.

## Why

v1 checklist (phase 0): "monorepo and contexts, infra up; domain, SSL, mail". Buckets needed from phase 10 (AI photos) — create from day 1 per ADR 0008 pattern (separate, with lifecycle).

## Sources

- `roadmap.md` v1 checklist (phase 0); ADR 0017 (domains); ADR 0008/0015 (buckets)

## Status

**Done** (2026-09-21, ADR 0018): dev stack starts with a single command — `docker compose -f infra/docker-compose.yml --env-file infra/.env.docker --profile deps up -d` (Postgres + Redis + MinIO + buckets, healthchecks); `apps` profile starts api/web/admin. Buckets are created **explicitly private** (`mc anonymous set none`, verified by `mc anonymous get`). CORS policy fixed (allowlist + env). CI on PR (format + lint + types + tests + design-tokens verify) — `.github/workflows/ci.yml`. Deployment, staging/prod, and domains/SSL moved to **T-303** (final steps).

## Done

- [x] Dependency dev stack starts with a single command (deps profile); `apps` profile starts api/web/admin (T-001)
- [x] CORS policy fixed (explicit allowlist; `docs/architecture.md`, `CORS_ALLOWED_ORIGINS`)
- [x] Buckets created with privacy policies (`mc anonymous set none`; verified by `mc anonymous get`)
- [x] CI: format + lint + types + tests + design-tokens verify on PR (`.github/workflows/ci.yml`)

> Domains/SSL/network mail and api/web/admin deploy pipeline moved to **T-303** (staging/prod — final steps, per founder decision 2026-09-21).

## Risks

- [ ] **Migrations**: schema changes break existing data — migration with backfill plan
- [ ] **Domain events**: subscriptions are idempotent (pattern ADR 0009/0016)
