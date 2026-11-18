---
id: T-4621
title: "Offline Resilience & Local Queue Sync for Barber & Admin Clients"
status: todo
sp: 13
priority: high
category: offline, resilience, pwa
phase: 40
milestone: M6
source: "docs/engineering-principles.md, architecture.md, local-first reliability"
adr: [0002, 0008]
screens: ["admin-screens.md", "barber-screens.md"]
---

# T-4621: Offline Resilience & Local Queue Sync for Barber & Admin Clients

## Overview

Barbershop operations (especially on mobile tablets and front-desk admin stations) frequently face intermittent Wi-Fi or cellular dropouts during peak rush hours. Currently, mutations like checking in a walk-in, marking a service started/completed, or noting a payment failure require online connectivity, leading to blocked chairs and front-desk friction.

This task introduces robust offline resilience via IndexedDB caching, optimistic UI updates, and an idempotent background sync queue (`OutboxQueue`) that replays mutations when connectivity is restored, preserving chair pacing without data corruption.

## Scope

- **IndexedDB Persistent Cache**: Cache barber schedules, active appointments, client summaries, and catalog pricing locally using Dexie.js or native IndexedDB wrappers.
- **Optimistic UI & Mutation Outbox**: Wrap critical write actions (check-in, status transitions, quick cash payment) in an outbox pattern that commits instantly to local state and enqueues background sync requests with idempotency keys.
- **Conflict Resolution & Dead Letter Queue**: Implement server-side last-write-wins with client vector timestamps, routing unresolvable conflicts to an admin review queue.
- **Connection Status Banner**: Add a persistent, non-intrusive offline/syncing banner in the admin and barber cabinet headers with manual sync trigger.

## Why

Unstable internet should never stop a barber from starting a fade or an admin from recording a cash payment. Preserving local operation during network glitches protects unit economics and prevents chair congestion.

## Sources

- `docs/engineering-principles.md` (resilience and fault tolerance)
- `docs/architecture.md` (offline-first data patterns)
- ADR 0002 (API design and idempotency)

## Done

- [ ] IndexedDB storage layer initialized with automatic migrations
- [ ] Mutation outbox successfully replays queued actions upon reconnection
- [ ] Idempotency headers correctly prevent duplicate transaction charges
- [ ] End-to-end tests verify offline check-in and subsequent sync

## Risks

- [ ] **Stale cache overwriting fresh server state.** Mitigation: Use version vectors and strict concurrency checks on critical appointment state updates.
- [ ] **Duplicate payment submissions.** Mitigation: Enforce mandatory server-side idempotency keys generated client-side at intent creation.

## Out of scope

- Full multi-day offline operation without re-authentication (tokens expire after 7 days)
- Peer-to-peer local sync between barber terminals
