# FADE Chair Turnover & Sanitation Pacing Optimization

## Overview
As the autonomous Barber Productivity and Capacity Specialist for the FADE platform (`Projects/barbershop/platform`), this feature introduces **Chair Turnover & Sanitation Pacing Optimization (`chair-sanitation-pacing-optimizer.ts`)**.

## Core Capabilities
1. **Dynamic Sanitation Turnaround Requirements**:
   - Computes required sanitation/sterilization and chair turnover times based on service type (`fade`, `beard`, `full_service`, `styling`) and client hair density (`fine`, `normal`, `thick`, `coarse`).
2. **Schedule Gap & Bottleneck Analysis**:
   - Compares actual schedule gaps between consecutive appointments against required sanitation minutes.
   - Flags specific appointment bottlenecks where actual gaps fall short of required turnover time.
3. **Compliance Scoring & Congestion Status**:
   - Generates overall sanitation compliance rate (`0.0` to `1.0`) and categorization (`optimal`, `moderate_risk`, `high_congestion`).

## Verification & Testing
- Fully covered by unit tests in `chair-sanitation-pacing-optimizer.spec.ts`.
- Verified successfully via Jest test runner.
