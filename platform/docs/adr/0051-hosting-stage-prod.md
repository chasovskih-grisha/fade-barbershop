# ADR 0051: Hosting — one Ukrainian VPS + Cloudflare R2

- Status: accepted (revision 2026-11-11: cheapest host in Ukraine, prod only; supersedes Hetzner + Coolify)
- Date: 2026-09-25 (revision: 2026-11-11)
- Contexts: infra, devops, security; continuation of T-002/T-300/T-303/T-4531

## Context

Fade platform: NestJS monolith API, Next.js web/admin, Expo app, Postgres 16 + Redis 7 + S3-compatible object storage (media, AI references, feedback photos), Checkbox FPRPO integration, acquiring, SMS, Expo Push. Dev is fully Docker (ADR 0018).

The API is a long-running NestJS process, so it cannot run on Vercel. Web and admin are Next.js apps that proxy to that API, and the client session cookie is `Domain=.fade.com.ua` (ADR 0017), so api, web and admin stay on one machine.

Prices below were read from the provider pages on 2026-11-11.

## Decision

Cheapest host whose machine is in Ukraine, about **$10/month**:

1. **Compute — one GMHost KVM VPS in Ukraine, tariff UA-VPS-4**: 2 vCPU, 4 GB RAM, 40 GB SSD, about $9.99/month. Ubuntu. Docker Compose runs api, web, admin, Postgres 16 and Redis 7. Caddy terminates TLS. This box is prod only.
2. **No Coolify and no second stack.** Coolify needs about 2 GB for itself. A copy of the stack for staging does not fit in what remains. Until the box moves to the 8 GB tariff, staging is the local Docker stack (ADR 0018). Remote `*.stage.fade.com.ua` (T-4531) waits for that step.
3. **Edge/DNS — Cloudflare (free)**: DNS for the domains in ADR 0017. Caddy serves TLS on the VPS. Cloudflare may proxy.
4. **Object storage — Cloudflare R2 (free tier 10 GB, egress $0)**: private buckets (media, AI photos, feedback photos per ADR 0008/0015) and an encrypted nightly database dump. R2 is the second geography. Media and the only backup do not live only on the Ukrainian disk.
5. **Cold DR**: the dump in R2 plus the same Compose file. If the host is lost, rent another KVM, restore the dump, and point DNS at it. RPO ≤ 24 hours, RTO about 1–2 hours.
6. **Growth**: the next box is GMHost's 8 GB tariff in Ukraine (UA-VPS-8, about $19/month). A second provider and a hot standby wait until there is real traffic.

## Consequences

- About $10/month, billed by a Ukrainian provider. A 2 GB VPS is cheaper and cannot run this stack.
- 40 GB fills with old Docker images, so those images get pruned. Postgres for one shop stays small because media is in R2.
- The single Ukrainian host is a single point of failure. The 24.09.2026 loss of MiroHost's Kyiv datacenter, and the damage to CityHost's datacenter the same day, are why the dump and the media live in R2.
- Prod is not deployed without that R2 backup. A quarterly restore drill remains the check.
- The Compose file stays the portable unit: the same stack moves to another KVM without a rewrite.

## Alternatives rejected

1. **Hetzner CAX11 + Coolify** (the decision of 2026-09-25, about €8–10/month, staging and prod on one box) — cheaper in euros and outside Ukraine. Superseded because the host must be the cheapest machine located in Ukraine.
2. **Vercel for web and admin** — the API cannot run there, and the two Next apps only proxy to it. That split adds a second deploy system.
3. **CityHost Ukraine KVM-75** (3 vCPU, 4 GB, 75 GB, about 1088 UAH/month) — more expensive, and that provider's datacenter was already damaged on 24.09.2026.
4. **A 2 GB VPS** (GMHost UA-VPS-2 and the equivalents) — api, web, admin, Postgres and Redis do not fit.
5. **Coolify on this box** — its own process takes the memory the apps need.
6. **PaaS (Render, Railway, Lizard)** — about $30–60/month, and the database is not a portable Compose service.
7. **Shared hosting** — no long-running Nest process, and no Postgres and Redis beside it.

## Superseded decision (2026-09-25)

One Hetzner VPS (Falkenstein/Frankfurt, CAX11) with Coolify running api, web, admin, Postgres and Redis, staging in isolated containers on the same host, Cloudflare DNS and R2, cold DR, no hot standby until traffic. That was the portable cheap option after the 24.09.2026 datacenter losses. Revision 2026-11-11 keeps R2, Compose and cold DR, and moves the machine to Ukraine.

## Closed T-303 question (#9 — hosting provider)

GMHost UA-VPS-4 in Ukraine, Compose and Caddy, Cloudflare DNS, R2 for media and backups. Remote staging (T-4531) starts when the VPS is the 8 GB tariff.
