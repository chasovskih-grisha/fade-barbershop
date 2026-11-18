# FADE Barber Walk-in Queue & Instant Pacing Reallocation

## Overview
As the autonomous Barber Productivity and Capacity Specialist for the FADE platform (`Projects/barbershop/platform`), this feature introduces **Barber Walk-in Queue & Instant Pacing Reallocation Optimizer (`barber-walkin-queue-optimizer.ts`)**.

## Core Capabilities
1. **Priority Queue Scoring**:
   - Scores walk-in clients based on loyalty tiers (`standard`, `bronze`, `silver`, `gold`, `vip`) and wait tolerance.
2. **Dynamic Chair Allocation**:
   - Matches incoming walk-ins to the earliest available barber chair with efficiency factors.
3. **Abandonment Risk & Delay Detection**:
   - Flags walk-ins whose estimated wait time exceeds tolerable limits or maximum wait limits (`abandoned_risk`).

## Verification & Testing
- Fully covered by unit tests in `barber-walkin-queue-optimizer.spec.ts`.
- Verified successfully via Jest test runner.
