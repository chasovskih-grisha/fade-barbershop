FROM node:18-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@9.15.0

# Copy workspace and lock files first for optimal caching
COPY pnpm-lock.yaml package.json ./

# Copy package.json files across packages to leverage layer caching for dependency installation
COPY packages/*/package.json ./packages/

RUN pnpm install --frozen-lockfile=false

# Copy remaining source code
COPY packages/ ./packages/

RUN pnpm build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app ./

EXPOSE 3000

CMD ["pnpm", "--filter", "web", "start"]
