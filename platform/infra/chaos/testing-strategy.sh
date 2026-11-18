#!/usr/bin/env bash
set -euo pipefail
echo "Executing testing strategy validation..."
docker compose -f infra/docker-compose.yml config
echo "Testing strategy validation complete."
