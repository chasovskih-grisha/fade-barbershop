# Barbershop Network Platform

Software system for the entire network: public website with blog, mobile app (client and barber), founder admin panel, shared API.

Application code **not yet written**: scaffold assembled and verified (T-001), business logic for phases 1–8 — ahead. Here are context boundaries, configs and decisions, so implementation doesn't diverge.

## What we're building

| Surface | Package | For whom | Purpose |
|----------|--------|----------|---------|
| Site + blog + cabinet | `apps/web` | Guests and clients (OTP by phone) | Brand, SEO, articles, booking, cabinet |
| Admin | `apps/admin` | Founder | Locations, staff, network calendar, clients, blog CMS |
| Mobile iOS + Android | `apps/mobile` | Client and barber (roles in one app) | Booking, calendar, chat, **blog** |
| API | `apps/api` | All surfaces | Modular monolith, system of truth |

Screen and role details: [`docs/products.md`](docs/products.md).

## How it's structured

```
./
├── apps/
│   ├── web/              # Next.js — site, blog, client cabinet (scaffold)
│   ├── admin/            # Next.js — admin panel (scaffold)
│   ├── mobile/           # Expo — iOS + Android (scaffold)
│   └── api/              # Nest modules by bounded contexts (scaffold)
├── packages/
│   ├── contracts/        # OpenAPI + events
│   ├── domain-shared/    # minimal shared kernel
│   ├── design-tokens/    # design system tokens (tokens.json → dist)
│   └── ui/               # React components web/admin (T-004)
├── docs/                 # architecture, ADR, domain language, roadmap
└── infra/                # docker-compose: Postgres + Redis + MinIO + apps (ADR 0018)
```

Network business documents (brand, locations, finance, premises) live in a separate repository [FADE-Barber/company](https://github.com/FADE-Barber/company). This repository is only software.

## Branches

Repository has two branches: `stage` and `main` (ADR 0052).

- Work committed directly to `stage`. No feature branches, no feature pull requests.
- Only pull request — Release PR from `stage` to `main` (merge commit, no squash). It deploys to prod.
- After release, `main` is merged back to `stage`.

## Architectural rules (brief)

- **One backend** (modular monolith), not microservices.
- **Four clients**, one model: web, admin, mobile, future integrations.
- Dependencies **inward**: infrastructure → application → domain.
- Contexts don't import foreign entities. Connection — events and IDs.
- Calendar and clients — our platform. Checkbox and acquiring remain external (ACL).

Full explanation: [`docs/architecture.md`](docs/architecture.md). Decisions: [`docs/adr/`](docs/adr/).

## Bounded contexts

| Context | Type | System of truth for |
|---------|------|---------------------|
| `identity` | Generic | Login and roles |
| `locations` | Supporting | Points, chairs, staff |
| `catalog` | Supporting | Services and prices |
| `scheduling` | **Core** | Visits and calendar |
| `crm` | **Core** | Client card |
| `messaging` | **Core** | Chat client ↔ barber |
| `content` | Supporting | Blog |
| `haircut-ai` | Supporting | AI haircut selection by client photo |
| `loyalty` | Supporting | Bonus "every 7th visit — free" |
| `feedback` | Supporting | Client reviews on completed visits |
| `discounts` | Supporting | Promo codes, rules and VIP discounts |
| `analytics` | Supporting (read-model) | Founder KPI dashboard (hard requirement v1) |
| `portfolio` | Supporting | Public gallery of works "before/after" (client consent + moderation) |
| `gift-certificates` | Supporting | Prepaid certificates (balance, validity; ADR 0013) |
| `billing` | Generic + ACL | Payment, cash register |
| `notifications` | Generic | Push / SMS / email |

Map: [`docs/bounded-contexts.md`](docs/bounded-contexts.md). Language: [`docs/ubiquitous-language.md`](docs/ubiquitous-language.md).

## Stack (fixed)

| Layer | Choice |
|-------|--------|
| Language | TypeScript, Node 20+ |
| Repository | pnpm workspaces in this monorepo |
| API | NestJS, module = bounded context |
| Site / admin | Next.js (App Router) |
| Mobile | Expo (one binary, roles client / barber) |
| DB | PostgreSQL 16 |
| Cache / realtime / jobs | Redis |
| Object storage | S3-compatible (MinIO in dev — buckets `haircut-ai-photos`, `feedback-photos`, `media`; ADR 0008/0015) |
| ORM | Prisma (only `infrastructure/`) |
| Dev environment | **Docker** (ADR 0018): dependencies and apps in containers, mobile — on host |

Justification: [`docs/adr/0003-typescript-stack.md`](docs/adr/0003-typescript-stack.md).

## When to start coding

See [`docs/roadmap.md`](docs/roadmap.md). First implementation step — Identity + API scaffold, not UI.

Dev environment raised by Docker (ADR 0018) — details and modes: [`infra/README.md`](infra/README.md), ports: [`LOCALHOST_PORTS.md`](LOCALHOST_PORTS.md). From repository root:

```bash
cp infra/.env.docker.example infra/.env.docker
make up        # deps + api/web/admin
make up-obs    # + Prometheus, Grafana, Loki
```

Against the same dependencies you can work on host too: `pnpm install`, `pnpm --filter @fade/api dev`
(api 13000, web 13001, admin 13002; Expo Metro 18081). Containers and host share these ports — run only one.

Scaffold already assembled (`pnpm build` / `lint` / `typecheck` / `test`). Don't run `create-next-app` / `create-expo-app` / `nest new` — scaffolds already exist, roadmap phases add business code.
