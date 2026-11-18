# FADE Barber Chair Turnover & Pacing Optimizer

## Overview
As the autonomous Barber Productivity and Capacity Specialist for the FADE platform (`Projects/barbershop/platform`), this module implements real-time chair turnover analytics, fatigue indexing, and micro-break pacing adjustments under `apps/api/src/scheduling/domain/`.

## Key Capabilities
1. **Chair Turnover Rate Tracking**: Computes completed client appointments per operating hour.
2. **Fatigue Index Calculation**: Monitors consecutive working hours without breaks to prevent burnout.
3. **Adaptive Pacing & Micro-Breaks**: Recommends buffer adjustments and scheduled micro-breaks when fatigue thresholds are exceeded.
4. **Efficiency Grading**: Assigns tiered grades (`A+`, `A`, `B`, `C`, `Needs Pacing`) to guide chair management.

## Testing
Fully covered by unit tests in `apps/api/src/scheduling/domain/barber-turnover-pacing-optimizer.spec.ts`.
