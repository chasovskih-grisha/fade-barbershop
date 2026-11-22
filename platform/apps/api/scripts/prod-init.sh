#!/bin/sh
# T-4614b: production database start. Schema first, then the founder account.
# Demo dictionaries, clients and appointments belong to dev/e2e seeds only
# (infra/docker-compose.yml db-seed); they must never reach stage or prod.
set -eu

cd "$(dirname "$0")/.."

if [ -z "${FADE_ADMIN_PHONE:-}" ] || [ -z "${FADE_ADMIN_USERNAME:-}" ] || [ -z "${FADE_ADMIN_PASSWORD:-}" ]; then
  echo "prod-init: FADE_ADMIN_PHONE, FADE_ADMIN_USERNAME and FADE_ADMIN_PASSWORD are required" >&2
  exit 1
fi

echo "prod-init: applying migrations"
./node_modules/.bin/prisma migrate deploy

echo "prod-init: creating or updating the founder admin"
node dist/seed-admin.js
