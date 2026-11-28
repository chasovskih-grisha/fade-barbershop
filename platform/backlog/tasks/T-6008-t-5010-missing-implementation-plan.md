---
id: T-6008
title: "Defect: T-5010 missing implementation plan verification checks"
status: split
sp: 2
priority: medium
category: qa, devops
phase: 50
milestone: M10
source: "agent-gate qa failure on T-5010"
---

# T-6008 · Defect: T-5010 missing implementation plan verification checks

- **Stage**: M10 · **Tags**: qa, devops · **Complexity**: junior · **Depends on**: T-5010
- **StoryPoints**: 2

## What

Task T-5010 in review lacks an `## Implementation plan` with executable check commands (`Checks:`), causing `agent-gate qa` to fail.

## Implementation plan

Checks:
- `node scripts/validate-docs/check-backlog.mjs`


## Structural resolution (2026-11-26): split, not a doc-only defect

The defect's only possible repair was a `backlog/` edit, and `reviewTask` excludes `backlog/` from the
paths a seat owns — a row that cannot produce a product diff can never pass the gate by construction.
Split per the T-4870a/b convention: the parent closes as `split`, and the child owns the executable
check the missing plan needed.

## Blocking rule

Cannot pass `agent-gate review`, and cannot be repaired at all: T-5010's deliverable is a chaos drill on
a staging cluster that does not exist here, so there is no executable `Checks:` to add. The defect's only
possible outcome is a `backlog/` edit, which `reviewTask` excludes from owned paths. Evidence recorded in
`T-5010-automated-disaster-recovery-drills.md` under "Gate evidence (T-6008)". Left un-claimed.
