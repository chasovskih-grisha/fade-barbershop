---
id: T-6011
title: "Defect: T-300 missing implementation plan verification checks"
status: split
sp: 2
priority: medium
category: qa, devops
phase: horizontal
milestone: horizontal
source: "agent-gate qa failure on T-300"
---

# T-6011 · Defect: T-300 missing implementation plan verification checks

- **Stage**: horizontal · **Tags**: qa, devops · **Complexity**: junior · **Depends on**: T-300
- **StoryPoints**: 2

## What

Task T-300 in review lacks an `## Implementation plan` with executable check commands (`Checks:`), causing `agent-gate qa` to fail.

## Implementation plan

Checks:
- `node scripts/validate-docs/check-backlog.mjs`


## Structural resolution (2026-11-26): split, not a doc-only defect

The defect's only possible repair was a `backlog/` edit, and `reviewTask` excludes `backlog/` from the
paths a seat owns — a row that cannot produce a product diff can never pass the gate by construction.
Split per the T-4870a/b convention: the parent closes as `split`, and the child owns the executable
check the missing plan needed.

## Blocking rule

Cannot pass `agent-gate review`: repairing T-300 means editing `backlog/` and `infra/`, neither of which
is owned by a craft seat for `reviewGaps` (`devops` owns `infra/` only, and a markdown edit is not
"substantial" code). A defect row that only edits docs has no product file to own, so the gate refuses it
by construction. Evidence recorded in `T-300-monitoring-security.md` under "Gate evidence (T-6011)".
Left un-claimed.
