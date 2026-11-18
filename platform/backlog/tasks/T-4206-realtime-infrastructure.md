# T-4206 · Real-time-infrastructure

- **Stage**: M5 (phase 30) · **Tags**: backend, frontend, integration, high-risk · **Complexity**: senior · **Depends on**: T-040, T-081, T-130
- **StoryPoints**: 20

## What
WebSocket-платформа: Socket.io / uWebSockets.js / GraphQL subscriptions (Yoga/Pothos), connection manager (auth, heartbeat, reconnect, backoff), presence (онлайн/офлайн/друкує), pub/sub через Redis adapter (горизонтальне масштабування), rooms/namespaces (per локація/барбер/запис), події життєвого циклу з'єднань, метрики (з'єднання, повідомлень/сек, latency), load testing (10k одночасних), graceful degradation (fallback на polling/SSE).

## Why
Живі слоти, чат, сповіщення — потребують real-time. Polling не масштабується. Presence = UX.

## Sources
- docs/realtime.md — фантом 2026-09-22: файл ніколи не існував; джерело приймається на старті задачі
- Socket.io / GraphQL subscriptions / Redis adapter
- ADR 0002 (модульний моноліт; realtime — через інфраструктурний шар, README notifications)

## dependencies
> Слайси виділяються при старті задачі; окремі файли підзадач створюються тоді ж за потреби.
