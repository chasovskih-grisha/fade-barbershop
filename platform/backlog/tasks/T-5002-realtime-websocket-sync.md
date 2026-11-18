# T-5002 · Realtime WebSocket Synchronization & Optimistic UI Conflict Resolution

- **Stage**: M4 (phase 13) · **Tags**: backend, frontend, architecture, realtime · **Complexity**: senior · **Depends on**: T-4492, T-4508
- **StoryPoints**: 13

## What

- Implement a robust WebSocket gateway (Socket.io / native WS with Redis adapter) in the NestJS backend (`platform/apps/api`) for real-time synchronization of slot status changes, barber schedule updates, and walk-in queue additions across admin dashboard, barber app, and public booking site.
- Build client-side optimistic UI update handlers with automatic rollback and conflict resolution strategies (Last-Write-Wins vs. Operational Transformation / Vector Clocks) when concurrent modifications occur.
- Add heartbeat, automatic reconnection with exponential backoff, and offline queue synchronization upon reconnection.
- Provide comprehensive E2E test scenarios validating multi-client synchronization latency under network partitions.

## Why

Barbershop operations require instant visibility into schedule changes, walk-ins, and slot lock expirations across multiple devices (reception desk, barber tablets, founder dashboard). Polling introduces stale states and booking conflicts; real-time event distribution ensures zero out-of-sync UI states during peak load.

## Sources

- `platform/docs/architecture.md`, `platform/docs/observability.md`, T-4492, ADR 0012

## Status

**Todo**

## Done

- [ ] WebSocket gateway cluster deployed with Redis pub/sub adapter
- [ ] Event protocol specified for appointment state changes and slot locks
- [ ] Frontend optimistic update state machine with conflict resolution implemented
- [ ] Reconnection and offline queue sync tested under simulated network drops
- [ ] Performance metrics and connection gauges added to Prometheus/Grafana
