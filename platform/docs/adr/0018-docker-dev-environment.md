# ADR 0018: Development in Docker — dependencies and apps in containers

- Status: accepted
- Date: 2026-09-14
- Contexts: `infra/` (stack owner), T-001 (application scaffold), T-002 (infrastructure and CI)

## Context

Monorepo scaffold already exists, but dev-environment assembled manually: Postgres and Redis raised via compose, object storage (S3-compatible buckets per ADR 0008/0015 — needed "from day one" per T-002) not deployed at all, and policy "where application code runs during development" not fixed anywhere. Without such decision each participant assembles own environment, and "works for me" becomes norm; and phase 10 (AI) and store will hit missing buckets at moment when their implementation already started.

## Decision

### 1. Docker — only way to deploy dev-environment

- **Dependencies** (Postgres 16, Redis 7, MinIO) — always in containers, raised by one command from `infra/docker-compose.yml` (profile `deps`).
- **Applications** (`apps/api`, `apps/web`, `apps/admin`) — also in containers (profile `apps`), from T-001. Images are `infra/{api,web,admin}.Dockerfile` (Node 20-alpine, `pnpm install`, monorepo sources; dev command set by compose via `command:`). Host ports — non-standard and only on loopback `127.0.0.1`: 13000 (api), 13001 (web), 13002 (admin); 3000/3001 often occupied by other projects.
- **Mobile (Expo) — exception**: not containerized, because needs iOS/Android simulator on host. Containerized Expo would give only extra layer without gain. Mobile launched from host (Metro on `localhost:18081`) and hits API via `localhost:13000`.

### 2. MinIO instead of "buckets later"

S3-compatible storage — part of base stack from today, not at phase 10: MinIO in compose + one-time init of three separate private buckets (`haircut-ai-photos` — ADR 0008, `feedback-photos` — ADR 0015, `media` — store and gallery). Same API that will be in prod, so `PhotoRepository` code written once against S3 client and doesn't notice environment difference.

### 3. Two modes, one file

- **`--profile deps`** — scaffold mode: only infrastructure; apps can run from host (`pnpm dev`) when their phase starts.
- **`--profile apps`** — from T-001 (active): api/web/admin in containers. One compose file, without "second true" environment description; profile only enables services, contracts unchanged.

### 4. Env contracts separated by consumer

- `infra/.env.docker` (from `.env.docker.example`) — read by **compose**: service credentials and ports and S3 config for apps **inside** network (`http://minio:9000`).
- `platform/.env.local` (from `.env.example`) — read by **apps on host** (mobile, local scripts): `DATABASE_URL`, `REDIS_URL`, `S3_ENDPOINT=http://localhost:19000`.
- Difference only in hostname: everything else — same as will be in prod (S3 client, force-path-style, private buckets, signed URLs).
- **Host ports non-standard and bound to `127.0.0.1`** (Postgres 15432, Redis 16379, MinIO 19000/19001), containers have unique names `fade-platform-*` and own network `fade-platform-net` — stack doesn't conflict with local services or other projects.

### 5. Hot reload doesn't serve stale bundle

`nest start --watch --webpack` restarts API only after **successful** rebuild: `WebpackCompiler` calls restart-hook only when `stats.hasErrors()` — false. On failed webpack rebuild emits nothing, so container stays alive with old bundle `dist/main` — code in `src/` and live response diverge, until someone manually restarts container (fixed as finding in T-043/README).

Fixed in `apps/api` without Nest patch: `apps/api/webpack.config.js` (only adds plugin to Nest's own `webpackDefaultsFactory`) writes `dist/.build-status.json` on each completed build, and supervisor `apps/api/scripts/dev-watch.mjs` owns API process: on failed build **kills** server, and (re)starts it only after successful. Compose api command calls supervisor directly.

Two non-obvious details, without which signal breaks:

- **Typical errors don't reach `stats.hasErrors()` in watch mode.** Nest keeps ts-loader in `transpileOnly: true` and delegates types to `ForkTsCheckerWebpackPlugin`, whose `done`-tap **asynchronous**: bundle builds, `done` already fired, and type-check comes later. Therefore status written from plugin's own `issues` hook (there bundle error count known from `compilation.errors`), not from `done`.
- **`deleteOutDir` is false.** `apps/api/dist` is the `api_dist` volume, a mount point. `fs.rm(dist)` returns `EBUSY`, Nest exits, and the API container never listens — web and admin then have nothing to call. The build-status file, not a missing `dist/`, decides whether the server runs. A failed rebuild can leave the previous bundle on disk; the supervisor does not serve it.

Guarantee: while build in progress, serves last **successful** bundle (as usual hot-reload); once build completes **with failure** — server not running (fail-closed), and after fix rises itself. `nest build` (prod) uses tsc and doesn't read this webpack config.

## Consequences

- Positive: dev-stack reproduced by one command for everyone and in CI; buckets with privacy per ADR 0008/0015 exist before first line of `PhotoRepository`; "works for me" gap disappears; prod-migration cheaper, because dev and prod talk to same S3 client.
- Negative / cost: Docker becomes mandatory for development (acceptable: already needed for Postgres/Redis); pnpm-monorepo images contain dependencies fully (bind-mount and volumes for hot reload — future optimization, current build reproducible and isolated from host); MinIO — another service to monitor (healthcheck added).

## Revision

- 2026-11-11: The hot-reload optimization above is in place for `db-seed`, `api`, `web`, and `admin`. Compose bind-mounts the platform tree, so source, `package.json`, and `pnpm-lock.yaml` are live. Linux `node_modules`, the pnpm store, Next `.next`, and `apps/api/dist` stay on named volumes so the macOS install on the host is not used inside Alpine. `infra/dev-sync.sh` runs `pnpm install --frozen-lockfile` when the lockfile hash changes. A new dependency does not require an image rebuild. Rebuild the image when the Dockerfile or the base image changes.
- Not solving: prod-hosting and CI-deploy — this T-002 and separate decision in `docs/adr/`; CI runs same compose in jobs-mode.

## Considered alternatives

1. **"Only dependencies in Docker, apps on host"** — status quo. Rejected: exactly this today; each dev assembles Node/pnpm environment manually, CI and prod still need containers — double maintenance.
2. **Devcontainers / dev-container IDE** — convenient for one editor, but binds workflow to IDE and doesn't give single artifact for CI. Rejected as main path (compose file consumed by CI too).
3. **Cloud dev storage (real S3/R2) instead of MinIO** — faster at start, but private client photos in shared dev bucket break environment isolation and ADR 0008/0015; custom domains and lifecycle policies on dev more complex. Rejected.
4. **Kubernetes / Docker Swarm locally** — unjustified complexity for monolith with three dependencies; can return to topic at phase 9 scale (second location). Rejected.
