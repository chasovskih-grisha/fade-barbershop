---
id: T-6007
title: "Defect: T-4422 missing implementation plan verification checks"
status: review
sp: 2
priority: medium
category: qa, backend, frontend
phase: 1
milestone: M1
source: "agent-gate qa failure on T-4422"
---

# T-6007 · Defect: T-4422 missing implementation plan verification checks

- **Stage**: M1 · **Tags**: qa, backend · **Complexity**: junior · **Depends on**: T-4422
- **StoryPoints**: 2

## What

Task T-4422 in review lacks an `## Implementation plan` with executable check commands (`Checks:`), causing `agent-gate qa` to fail.

## Implementation plan

Checks:
- `node scripts/validate-docs/check-backlog.mjs`

## Progress

- **2026-11-26 — plan added to T-4422.** `backlog/tasks/T-4422-client-devices-sessions.md` now carries `## Implementation plan` with the owned paths (`apps/api/src/identity/application/list-client-sessions.ts`, `revoke-all-sessions.ts`, `apps/api/src/identity/infrastructure/client-sessions.controller.ts`, `apps/web/src/app/account/devices/DeviceList.tsx`), the test files and `Checks:` commands. `planProblems` returns null for both the backend and frontend seats. Checks run green: api `list-client-sessions.spec.ts` + `revoke-all-sessions.spec.ts` 12/12, web `devices.test.tsx` 4/4.
