# Fade Barbershop — Development Makefile
# Run from anywhere: make -C <platform-root> up
# Paths are anchored to this file, not the shell cwd.

.PHONY: up up-obs down down-volumes logs ps test clean restart seed seed-dev

ROOT := $(patsubst %/,%,$(dir $(abspath $(lastword $(MAKEFILE_LIST)))))
COMPOSE := docker compose -f $(ROOT)/infra/docker-compose.yml --env-file $(ROOT)/infra/.env.docker

# Start all services (deps + apps). Mailpit is on the deps profile, not apps.
up:
	$(COMPOSE) --profile deps up -d
	$(COMPOSE) --profile apps up -d
	@echo ""
	@echo "=== Services started ==="
	@echo "Web:      http://localhost:13001"
	@echo "API:      http://localhost:13000"
	@echo "Admin:    http://localhost:13002"
	@echo "MinIO:    http://localhost:19001"
	@echo "Mailpit:  http://localhost:19096 (OTP codes)"

# Start all services including observability
up-obs:
	$(COMPOSE) --profile deps up -d
	$(COMPOSE) --profile apps up -d
	$(COMPOSE) --profile obs up -d
	@echo ""
	@echo "=== Services started (with observability) ==="
	@echo "Web:          http://localhost:13001"
	@echo "API:          http://localhost:13000"
	@echo "Admin:        http://localhost:13002"
	@echo "MinIO:        http://localhost:19001"
	@echo "Mailpit:      http://localhost:19096"
	@echo "Prometheus:   http://localhost:19090"
	@echo "Grafana:      http://localhost:19094 (admin/admin)"
	@echo "Alertmanager: http://localhost:19093"
	@echo "Loki:         http://localhost:19095"

# Stop all services
down:
	$(COMPOSE) --profile deps --profile apps --profile obs down

# Stop and remove volumes (full reset)
down-volumes:
	$(COMPOSE) --profile deps --profile apps --profile obs down -v

# View logs for all services
logs:
	$(COMPOSE) --profile deps --profile apps --profile obs logs -f

# View logs for specific service (usage: make logs-api)
logs-%:
	$(COMPOSE) --profile deps --profile apps --profile obs logs -f $*

# Show running containers
ps:
	$(COMPOSE) --profile deps --profile apps --profile obs ps

# Test if services are healthy
test:
	@echo "Testing API health..."
	@curl -sf http://localhost:13000/health > /dev/null && echo "✓ API healthy" || echo "✗ API not responding"
	@echo "Testing Web..."
	@curl -sf http://localhost:13001 > /dev/null && echo "✓ Web healthy" || echo "✗ Web not responding"
	@echo "Testing Admin..."
	@curl -sf http://localhost:13002 > /dev/null && echo "✓ Admin healthy" || echo "✗ Admin not responding"

# Clean build artifacts
clean:
	$(COMPOSE) --profile deps --profile apps --profile obs down -v --rmi local --remove-orphans

# Restart services
restart: down up

# Recreate database fixtures (full reset with migrations + seeds)
seed:
	$(COMPOSE) --profile apps exec api pnpm --filter @fade/api seed:e2e

# Quick dev seed (no migration reset)
seed-dev:
	$(COMPOSE) --profile apps exec api pnpm --filter @fade/api seed:dev
