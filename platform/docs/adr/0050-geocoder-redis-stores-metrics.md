# ADR 0050: Distributed geocoder stores (Redis) and observability metrics

## Status
**Accepted** — 2026-09-25. Implemented together with this ADR: `geocoder-stores.factory.ts` (mode selection), `redis-geocoder-stores.ts` + `redis-geocoder.lua.ts` (adapters), `geocoder-metrics.ts` (counters), `shared/health/` (/health endpoint).

## Context

`CachedRateLimitedGeocoder` (ADR 0022, MNG-ADM-18) held state — TTL response cache, sliding window rate limits (Nominatim policy ≤1 req/s), tombstone after 3 failures — in-process. Correct for one container, but on multi-container deploy (T-303) each API instance gets own rate budget: N containers → up to N req/s to Nominatim, separate caches (lower hit-rate) and tombstone knowing only own failures.

Parallel observability (docs/observability.md) had only logs: cache hits, rate limit failures and provider failures not visible by any probe — impossible to distinguish "geocoder silently degrades" from "geocoder alive".

Constraints: Redis already in dev stack (ADR 0018, compose service `redis`); geocoder not critical to Redis — locations list doesn't depend on it; file limit < 100 LOC (ADR 0019); tests without network (engineering-principles).

## Decision
1. **Decorator state — via three domain ports** (`GeocoderCacheStore`, `GeocoderRateLimitStore`, `GeocoderTombstoneStore`, `locations/domain/geocoder-stores.ts`). Two implementations: `Local*` (in-process Map, one container) and `Redis*` (shared between instances). Decorator same — only assembly changes.
2. **Mode selection — env at build/deploy**: `FADE_GEOCODER_STORE=redis|local` (default `local`) + `FADE_REDIS_URL`. Limits and tombstone atomicity — Lua scripts (sliding window on ZSET; INCR+threshold for tombstone). Keys scoped on adapter (`geocoder:{adapter}:{scope}:{key}`) — nominatim/google budgets separated.
3. **Fail-open mandatory**: Redis unavailable → cache miss, slot allowed, no tombstone; request honestly goes to provider (for nominatim local degradation pattern still holds limit → null). Geocoder never fails due to Redis.
4. **Counters — in-process `GeocoderMetrics`**: `cache_hit`, `cache_miss`, `rate_limit_rejected`, `tombstoned`, `provider_failure`, `provider_success`. Decorator increments via optional dependency — metrics don't break geocoder. Aggregation between instances (Prometheus, T-4204) will collect snapshot from each instance separately.
5. **GET /health** (`shared/health`): `status`, `uptimeMs`, `geocoder.counters`, `geocoder.stores` (configured/effective mode per adapter + `redisUnavailable`). Probe always 200 while process alive: degradations visible in fields, not as 503 — container probes don't raise noise from intentional geocoder degradation.
6. **Rate limit for /health not introduced** (exception from T-4210, as for webhooks): probes must be cheap and without authentication.

## Consequences
### Positive
- Multi-container: total rate budget = Nominatim policy regardless of instance count; cache shared (higher hit-rate); tombstone global.
- Failure resistance: Redis down = degrade to local behavior, not API down.
- Cache/rate/tombstone and provider failures visible in /health immediately, without Prometheus deploy.
- Mode switch — env/deploy, without code change (same pattern as MNG-ADM-18 for provider).

### Negative
- Lua scripts and PX-TTL — non-trivial semantics; covered by spec on scripted fake Redis (semantics reproduced manually — real Redis discrepancy risk minimized by script simplicity).
- Counters lost on process restart (in-process) — acceptable until T-4204.
- /health shows mode but doesn't ping Redis on each request — `redisUnavailable` updated lazily (on client attempt).

## Implementation Checklist
- [x] Storage ports in domain; Local and Redis implementations; factory by env
- [x] Lua scripts: sliding window, tombstone, deletion
- [x] `GeocoderMetrics` + increments in decorator; specs
- [x] GET /health (HealthModule in AppModule; counters + stores per adapter)
- [x] compose: `FADE_GEOCODER_STORE=redis`, `FADE_REDIS_URL` for api (apps profile)
- [x] `ioredis` — runtime dependency @fade/api
- [ ] Real smoke with Redis in container (together with T-303 deploy)

## References
- ADR 0022 (geocoder and rate limit discipline), ADR 0018 (Redis in dev stack), ADR 0019 (LOC limit — hence helper files)
- MNG-ADM-18 (live settings), docs/observability.md (observability base), T-4204 (future Prometheus)
- [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/)
