---
id: T-6014
title: "Defect: T-4802 review does not add a test from the implementation plan"
status: todo
sp: 2
priority: medium
category: qa, backend
phase: horizontal
milestone: horizontal
source: "agent-gate qa failure on T-4802"
---

# T-6014 · Defect: T-4802 review does not add a test from the implementation plan

- **Stage**: horizontal · **Tags**: qa, backend · **Complexity**: junior · **Depends on**: T-4802
- **StoryPoints**: 2

## What

Task T-4802 in review does not add a test from the implementation plan in its review commit, causing `agent-gate qa` to fail.

## Implementation plan

Checks:
- `pnpm --filter @fade/api exec jest src/scheduling/application/slot-reservations src/scheduling/domain/slot-reservation src/scheduling/infrastructure/redis-slot-lock`
