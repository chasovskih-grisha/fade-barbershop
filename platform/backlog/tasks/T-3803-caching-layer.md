# T-3803 · Caching layer

- **Stage**: M5 (phase 30) · **Tags**: backend, performance · **Complexity**: middle · **Depends on**: T-002, T-3802
- **StoryPoints**: 15

## What

Redis caching: L1 (in-memory) + L2 (Redis Cluster), strategies: cache-aside, read-through, write-through, TTL by data types, tag/event invalidation (outbox), cache warming on startup, circuit breaker, metrics (hit ratio, latency, memory), fallback to DB.

## Why

Performance under load. Reduced database load. Peak stability.

## Sources

- docs/caching.md — phantom 2026-09-22: file never existed; source accepted at task start
- Redis Cluster

## dependencies
> Slices are created upon task start; individual subtask files are created then if needed.
