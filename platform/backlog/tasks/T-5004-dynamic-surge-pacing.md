# T-5004 · Dynamic Surge Pricing & Peak-Load Time Slot Pacing Engine

- **Stage**: M4 (phase 13) · **Tags**: backend, pricing, analytics, ai · **Complexity**: senior · **Depends on**: T-4811, T-4464, T-152
- **StoryPoints**: 13

## What

- Implement an algorithmic dynamic pricing and slot pacing engine that adjusts service prices and slot availability multipliers based on real-time demand velocity, historical slot fill rates, weather forecasts, and local events.
- Build automated slow-hour discount suggestion and surge-hour premium pricing rules configurable by location managers.
- Provide transparent client-facing price breakdowns and surge badges during the public booking flow.
- Add analytics projection models tracking revenue yield optimization vs. conversion rate elasticity.

## Why

Fixed pricing during peak Friday/Saturday demand leaves revenue on the table, while empty Tuesday morning slots incur idle chair costs. Dynamic surge pricing and intelligent pacing optimize overall location revenue and smooth out capacity utilization.

## Sources

- `platform/docs/composed-service-slot-optimization.md`, `platform/docs/barber-peak-load-dispatch-optimization.md`, T-4811, T-4464

## Status

**Todo**

## Done

- [ ] Demand velocity calculation service and pricing multiplier matrix implemented
- [ ] Location manager configuration UI for surge boundaries and discounts built
- [ ] Public booking flow updated with transparent price breakdown and surge indicators
- [ ] Yield management analytics dashboard reporting revenue uplift and conversion elasticity
