---
id: T-4622
title: "Advanced Real-Time Chair Occupancy & Slot Congestion Telemetry"
status: todo
sp: 8
priority: high
category: analytics, real-time, operations
phase: 15
milestone: M3
source: "docs/slot-congestion-optimization.md, observability.md, slo.md"
adr: [0003, 0011]
screens: ["admin-screens.md"]
---

# T-4622: Advanced Real-Time Chair Occupancy & Slot Congestion Telemetry

## Overview

During peak Friday and Saturday hours, barbershop slot congestion and chair turnaround bottlenecks directly limit daily revenue. While basic calendars show appointments, they lack real-time heatmaps of chair utilization, cleanup delays, and booking drop-off choke points.

This task implements real-time telemetry streaming via WebSockets/SSE from the API backend to the admin dashboard, rendering live chair occupancy meters, predicted overrun warnings, and automated buffer adjustments.

## Scope

- **Real-Time WebSocket/SSE Stream**: Broadcast chair state changes (`idle`, `prep`, `cutting`, `sanitizing`, `overrun`) instantly to all admin dashboard clients.
- **Congestion Heatmap UI**: Build an interactive admin calendar overlay showing minute-by-minute utilization percentages across all chairs in location CLT-01.
- **Dynamic Buffer Adjustment**: Automatically suggest or apply buffer padding extensions when average haircut durations exceed scheduled slots by >10% over a 2-hour window.
- **SLO Telemetry Integration**: Export chair idle time and turnover lag metrics to Prometheus/Grafana dashboards for operational monitoring.

## Why

Maximizing chair revenue requires sub-minute visibility into turnaround times. Real-time telemetry stops minor delays from cascading into multi-hour lobby bottlenecks.

## Sources

- `docs/slot-congestion-optimization.md`
- `docs/observability.md`
- `docs/slo.md`

## Done

- [ ] WebSocket/SSE event publisher active in API backend with automatic reconnection
- [ ] Admin calendar renders live chair occupancy indicators with <500ms latency
- [ ] Overrun alerts trigger visual warnings on the admin dashboard
- [ ] Prometheus metrics exported for chair turnover efficiency

## Risks

- [ ] **WebSocket connection storms on mobile/tablet wake.** Mitigation: Implement exponential backoff and jitter for reconnection attempts.
- [ ] **UI re-rendering overhead on dense calendars.** Tokenize and memoize grid cell components using React.memo.

## Out of scope

- Automated staff re-assignment based on congestion (handled in T-4522)
- External customer-facing waiting room TV app (handled in separate display task)
