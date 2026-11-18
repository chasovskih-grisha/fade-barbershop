# ADR 0003. TypeScript stack

- Status: accepted
- Date: 2026-09-07

## Context

Need SEO-site, admin panel, iOS and Android, API. One language reduces solo development cost.

Alternatives: Laravel API + separate JS front; native Swift/Kotlin; Flutter.

## Decision

| Part | Technology |
|------|------------|
| Monorepo | pnpm workspaces |
| API | NestJS + Prisma + PostgreSQL |
| Web, admin | Next.js App Router |
| Mobile | Expo (React Native), one binary |
| Realtime / jobs | Redis |
| Contracts | OpenAPI + JSON events in `packages/contracts` |

NestJS: module ≈ bounded context, DI for ports. Prisma doesn't leave `infrastructure/`.

Expo: one code on iOS and Android, push and stores simpler than two native clients.

## Consequences

- Shared contract types, faster cycle.
- RN chat/calendar quality must consciously hold (gestures, background, offline).
- Bundle id / package name depend on approved brand name.
