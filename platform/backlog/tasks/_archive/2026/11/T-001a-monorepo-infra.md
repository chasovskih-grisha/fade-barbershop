# T-001a · infrastructure monorepo (5/11)

- **Stage**: M0 (phase 0) · **Tags**: infra, devops · **Complexity**: middle · **Depends on**: none
- **StoryPoints**: 5

## What
Create base infrastructure: Docker-образи для api/web/admin, `infra/` compose-профіль `deps` з Postgres, Redis, MinIO, трьома бакетами (`haircut-ai-photos`, `feedback-photos`, `media`). Вsі buckets приватні (`mc anonymous set none`). Профіль `apps` для підняття applications.

## Why
Foundation for local development and CI. Buckets are required from phase 10 (AI photos) — created from day one.

## Sources
- ADR 0018 (infrastructure)
- ADR 0008/0015 (buckets)

## Done
- [x] Docker-образи api/web/admin
- [x] Compose-профіль `deps` з Postgres + Redis + MinIO + buckets
- [x] Buckets created private
- [x] Профіль `apps` для підняття applications

## dependencies
- T-001b (CORS and domain configuration)
- T-001c (CI pipeline)