# T-6003 · Advanced Dynamic Surge Pricing & Peak-Hour Yield Optimization Engine

- **Stage**: M4 (phase 21) · **Tags**: backend, analytics, pricing, algorithm · **Complexity**: senior · **Depends on**: T-040, T-111, T-4811
- **StoryPoints**: 8

## What

Implement a real-time yield optimization and dynamic surge pricing engine that adjusts haircut and styling service prices based on slot utilization velocity, historical demand patterns, barber seniority tier, and peak hours. Expose transparent price adjustments in booking flows with clear explanation badges.

## Why

Maximizes revenue per chair during high-demand peak hours while incentivizing booking shifts to off-peak morning and mid-week slots.

## Acceptance Criteria

1. Pricing engine calculates slot multipliers dynamically based on real-time occupancy rates.
2. Booking UI clearly displays surge pricing breakdown without hiding base service costs.
3. Admin reporting dashboard tracks yield uplift, occupancy distribution shifts, and revenue per available hour.
