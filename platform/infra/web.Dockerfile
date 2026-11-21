# Dev image for the platform apps (ADR 0018) with pnpm fetch caching optimization.
# Build context is the platform root (see infra/docker-compose.yml: context: ..).
FROM node:20-alpine AS dev

RUN apk add --no-cache libc6-compat
RUN corepack enable

WORKDIR /app

# Copy root configuration and workspace lockfile first
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json tsconfig.json ./

# Copy all package.json files across the workspace for dependency resolution and fetch
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/
COPY apps/mobile/package.json ./apps/mobile/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/domain-shared/package.json ./packages/domain-shared/
COPY packages/test-utils/package.json ./packages/test-utils/
COPY packages/ui/package.json ./packages/ui/
COPY packages/brand-assets/package.json ./packages/brand-assets/
COPY packages/design-tokens/package.json ./packages/design-tokens/
COPY packages/eslint-plugin-no-phantom-classes/package.json ./packages/eslint-plugin-no-phantom-classes/
COPY packages/eslint-plugin-uuid-keys/package.json ./packages/eslint-plugin-uuid-keys/
COPY mcp/package.json ./mcp/
COPY vendor/braces/package.json ./vendor/braces/
COPY vendor/ip/package.json ./vendor/ip/
COPY vendor/node-forge/package.json ./vendor/node-forge/

# Fetch dependencies into pnpm store (cached unless dependencies/lockfile change)
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm fetch

# Copy workspace source code
COPY apps/web ./apps/web
COPY packages ./packages
COPY mcp ./mcp
COPY vendor ./vendor

# Install dependencies offline from the fetched pnpm store
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --offline --frozen-lockfile

# ── Production image (T-4614a) ──────────────────────────────────────────────
# Explicit stage: the VPS (ADR 0051) builds `--target prod`, so it can never
# fall through to the dev recipe above. No host sources, no watch, next build.
FROM dev AS build

RUN pnpm -r --filter "./packages/*" build \
 && pnpm --filter @fade/web build

FROM node:20-alpine AS prod

RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app ./

WORKDIR /app/apps/web
EXPOSE 13001
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "13001"]
