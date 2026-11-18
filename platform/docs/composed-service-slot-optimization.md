# FADE Booking Engine Optimization: Composed Service Slot Allocator

## Overview
Added the `ComposedServiceSlotOptimizer` domain engine and unit test suite to optimize multi-service appointment scheduling across consecutive time blocks and specialized barber availability windows.

## Changes
- `apps/api/src/scheduling/domain/composed-service-slot-optimizer.ts`: Core optimization engine for composed multi-service slots with buffer intervals and barber specialty matching.
- `apps/api/src/scheduling/domain/composed-service-slot-optimizer.spec.ts`: Comprehensive test suite verifying successful sequential allocation and fallback behavior on insufficient availability.
