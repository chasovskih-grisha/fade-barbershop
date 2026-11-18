# Fade Barbershop — Localhost Services & Ports

## Applications (Profile: `apps`)

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| **Web** (Next.js) | 13001 | http://localhost:13001 | Public website + booking |
| **API** (NestJS) | 13000 | http://localhost:13000 | HTTP + realtime API |
| **Admin** (Next.js) | 13002 | http://localhost:13002 | Admin panel |

## Infrastructure (Profile: `deps`)

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| **PostgreSQL** | 15432 | `postgresql://barbershop:barbershop@localhost:15432/barbershop` | Primary database |
| **Redis** | 16379 | `redis://localhost:16379` | Cache, rate limits, sessions |
| **MinIO (S3 API)** | 19000 | http://localhost:19000 | Object storage (media buckets) |
| **MinIO Console** | 19001 | http://localhost:19001 | Web UI for MinIO |
| **Mailpit (SMSPitt)** | 19096 | http://localhost:19096 | Dev SMS/email capture (OTP codes) |

## Observability (Profile: `obs`)

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| **Prometheus** | 19090 | http://localhost:19090 | Metrics collection |
| **Alertmanager** | 19093 | http://localhost:19093 | Alert routing |
| **Grafana** | 19094 | http://localhost:19094 | Dashboards (admin/admin) |
| **Loki** | 19095 | http://localhost:19095 | Log aggregation |

---

## Quick Start

Commands run from the platform repository root (`make` also works from any directory via `make -C`).

### Using Makefile (recommended)
```bash
make up           # Start deps + apps
make up-obs       # Start deps + apps + observability
make down         # Stop all
make logs         # Follow all logs
make test         # Health checks
make seed         # Full DB reset + fixtures (migrations + all seeds)
make seed-dev     # Quick dev seed (no migration reset)
make clean        # Full cleanup (down -v --rmi local)
make restart      # down + up
```

### Using Docker Compose directly
```bash
# 1. Start dependencies only
docker compose -f infra/docker-compose.yml --env-file infra/.env.docker --profile deps up -d

# 2. Start applications (requires deps; Mailpit is on the deps profile)
docker compose -f infra/docker-compose.yml --env-file infra/.env.docker --profile apps up -d

# 3. Start observability (optional)
docker compose -f infra/docker-compose.yml --env-file infra/.env.docker --profile obs up -d
```

## View Logs

```bash
# API logs (shows OTP codes in dev)
docker logs -f fade-platform-api

# All services (from the platform repository root)
docker compose -f infra/docker-compose.yml --env-file infra/.env.docker --profile deps --profile apps --profile obs logs -f
```

## Environment

All ports bind to **127.0.0.1** (loopback only). Override via `infra/.env.docker`.
