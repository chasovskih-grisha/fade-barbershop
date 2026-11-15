FROM node:18-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@9.15.0

# Copy workspace and lock files first for optimal caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy package.json files across packages and apps to leverage layer caching for dependency installation
COPY packages/*/package.json ./packages/
COPY apps/*/package.json ./apps/

RUN pnpm install --frozen-lockfile=false

# Copy remaining source code
COPY packages/ ./packages/
COPY apps/ ./apps/

RUN pnpm build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app ./

EXPOSE 3000

CMD ["pnpm", "--filter", "web", "start"]
