# T-4569 · API & Webhooks platform: auth, rate limiting, idempotency, retries, signatures, versioning, logs

- **Stage**: M5 (phase 27-28) · **Tags**: backend, integration, platform, high-risk · **Complexity**: senior · **Depends on**: T-3102, T-3802, T-4207, T-4300d, T-4568
- **StoryPoints**: 21

## What

Публічний API та вебхук-платформа для партнерів/розробників (post-v1, M5/M6):
- **Authentication**: API Keys (HMAC-SHA256), OAuth 2.0 (Authorization Code + PKCE для веб-аппів), JWT для сервіс-ту-сервіс
- **Authorization**: scope-based (read:clients, write:appointments, read:analytics, webhooks:manage), role-based (partner, developer, internal)
- **Rate limiting**: tiered (Free: 100 req/min, Pro: 1000 req/min, Enterprise: custom), per-key + per-IP, sliding window
- **Idempotency**: `Idempotency-Key` header для POST/PUT/PATCH — збереження результату на 24г, повторний запит повершує кешований
- **Webhook retries**: exponential backoff (1m, 5m, 15m, 1h, 6h, 24h), max 7 спроб, dead letter queue після провалу
- **Webhook signatures**: HMAC-SHA256 payload + timestamp, header `X-Fade-Signature`, tolerance ±5 хв
- **Event versioning**: `eventVersion` в payload, підтримка v1/v2 паралельно, migration guide, deprecation policy (6 місяців)
- **Integration logs**: запит/відповідь (body, headers, status, latency) — retention 30 днів, пошук по correlationId
- **Failure handling**: DLQ UI в адмінці, replay кнопка, alerting при масових провалах
- **Developer Portal**: Documentation (OpenAPI/Swagger), API Explorer, ключі управління, webhooks тестування (ngrok-like tunnel)
- **SDKs**: TypeScript (npm `@fade/api-client`), Python (опціонально) — автогенерація з OpenAPI

## Why

Екосистема партнерів, кастомні інтеграції клієнтів, маркетплейс додатків. FADE = platform.

## Sources

- T-3102 (integrations), T-3802 (webhooks), T-4207 (API platform), T-4300d (contracts), T-4568 (external integrations)
- Altegio: public API, webhooks, autentykacja, rate limiting, idempotentność, podpisy, wersjonowanie, logi

## Done

- [ ] API Gateway: Kong / NestJS Gateway / AWS API Gateway — auth, rate limit, logging, routing
- [ ] Auth: API Key generation (prefix `fk_live_`/`fk_test_`), OAuth 2.0 server (Hydra/Keycloak або custom), JWT validation
- [ ] Rate limiter: Redis-based sliding window, distributed, configurable tiers
- [ ] Idempotency middleware: Redis key `idemp:{key}` → stored response, TTL 24h
- [ ] Webhook dispatcher: BullMQ queue, retry policy, signature generation, version routing
- [ ] Event schema: CloudEvents spec (source, type, specversion, id, time, datacontenttype, data)
- [ ] Developer Portal: Docusaurus + OpenAPI renderer, API key management UI, webhook tester
- [ ] SDK generation: `openapi-typescript-codegen` → `@fade/api-client` npm package, CI publish
- [ ] Monitoring: API latency p99, error rate, rate limit hits, webhook delivery success rate

## Risks

- [ ] **Security**: API key leakage — rotation, scopes, IP allowlist, audit log (T-4565)
- [ ] **Breaking changes**: сувора версіонування, deprecation policy, communication channel для розробників