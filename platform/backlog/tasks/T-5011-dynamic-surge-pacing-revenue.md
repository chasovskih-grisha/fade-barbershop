---
id: T-5011
title: "Dynamic Surge Pacing & Peak-Hour Revenue Optimization Engine"
status: todo
sp: 13
priority: high
category: pricing, revenue, analytics, backend
phase: 50
milestone: M10
source: "docs/revenue-pricing-optimization-report.md, unit-economics.md"
adr: [0016, 0023]
screens: ["admin-screens.md", "web-screens.md"]
---

# T-5011: Dynamic Surge Pacing & Peak-Hour Revenue Optimization Engine

## Overview

Barbershop capacity during peak weekend hours (Friday afternoon through Sunday evening) is constrained by physical chair count, whereas off-peak weekday slots (Tuesday morning) frequently have idle capacity. Flat pricing fails to balance demand or maximize revenue per chair hour.

This task implements a dynamic surge pricing and capacity pacing engine that automatically adjusts service pricing or applies priority incentives based on real-time slot congestion, historical demand velocity, and barber seniority.

## Scope

- **Real-Time Congestion Index**: Algorithm calculating slot demand pressure across locations and specific barbers based on booking velocity and lead time.
- **Dynamic Pricing Rules Engine**: Configurable margin multipliers (e.g., +15% for peak Saturday slots, -10% discount incentives for off-peak Tuesday slots) with transparent client-facing price breakdowns.
- **Barber Commission Adjustment**: Automatic recalculation of barber split percentages during surge slots to incentivize peak-hour staffing and high performance.
- **Revenue Analytics Dashboard**: Admin reporting tracking RevPASH (Revenue Per Available Seat Hour) and elasticity impact.

## Acceptance Criteria

1. Dynamic prices compute and display transparently in the booking flow within 50ms of slot selection.
2. Increases overall weekly RevPASH by at least 12% while smoothing peak-hour congestion spikes into off-peak windows.
3. Full admin configuration panel for surge rules, floor/ceiling price caps, and category exceptions.
