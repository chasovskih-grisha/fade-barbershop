# T-4211 · Scheduled Jobs and Cron

- **Stage**: M5 (phase 30) · **Tags**: backend, infra · **Complexity**: middle · **Depends on**: T-4200, T-300
- **StoryPoints**: 15

## What
Cron platform: **Tasks** — cleanup (expired tokens, orphaned files, old sessions, abandoned carts), reports (daily/weekly/monthly email), reminders (booking at 24h/2h/30m, feedback requests, birthdays), data sync (analytics aggregation, rebuild search index, cache warming), maintenance (vacuum, analyze, partition management, backup verification); **Scheduling** — Temporal cron / BullMQ repeatable jobs / pg_cron, distributed locking (Redis/PostgreSQL advisory locks), timezone-aware (stored in UTC, executed in user TZ), monitoring (success/failure/latency, alerts), manual trigger/replay, idempotency.

## Why
Automation of routine operations. Schedule = reliability. Distributed locking = no duplication upon scaling.

## Sources
- ADR 0048 (proposed)
- Temporal cron / BullMQ repeatable / pg_cron
- ADR 0018 (Docker dev environment; README notifications — periodic tasks)

## dependencies
> Slices are allocated at task start; separate subtask files are created then if needed.
