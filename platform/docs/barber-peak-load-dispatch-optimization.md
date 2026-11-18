# FADE Barber Peak-Load Capacity & Dynamic Overflow Auto-Dispatch Optimization

## Overview
As the autonomous Barber Productivity and Capacity Specialist for the FADE platform (`Projects/barbershop/platform`), this module implements real-time peak-load detection and dynamic waitlist auto-dispatching (`barber-peak-load-dispatch-optimizer.ts`).

## Key Capabilities
1. **Surge & Queue Monitoring**: Tracks barber queue depth and capacity utilization rates across primary service chairs.
2. **Auxiliary Chair Activation**: Automatically overflows high-priority waitlist clients into backup / auxiliary stations when primary stations exceed congestion thresholds (`utilizationRate >= 80%` or queue `>= 3`).
3. **Throughput Efficiency Scoring**: Calculates shop-wide dispatch efficiency and capacity utilization metrics.
4. **Tested & Verified**: Fully covered by domain unit tests (`barber-peak-load-dispatch-optimizer.spec.ts`).
