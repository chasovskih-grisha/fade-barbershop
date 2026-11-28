# T-3802 · API Platform

- **Stage**: M5 (phase 30) · **Tags**: backend, integration · **Complexity**: senior · **Depends on**: T-002, T-300
- **StoryPoints**: 20

## What
API Platform: OpenAPI 3.1 spec (auto-generation from code), versioning (/v1/, /v2/), developer portal (Redoc/Scalar), API keys / OAuth2 / JWT, rate limiting (token bucket), quotas, webhooks (T-3102), request/response validation, caching (ETag, Cache-Control), observability (OpenTelemetry), deprecation policy.

## Why
Third-party integrations. Partners. Public API for the ecosystem. Flexibility without breaking clients.

## Sources
- ADR 0002/0003 (API architecture; source: architecture.md)
- docs/architecture.md
- OpenAPI 3.1

## Dependencies
> Slices are defined when starting a task; individual subtask files are created at that time if needed.
