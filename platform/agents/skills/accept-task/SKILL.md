---
name: accept-task
description: Move the oldest review task to qa, or on a later run move a published qa task to done.
---

# Accept one reviewed task

Load this skill only for an `accept` run.

1. Stay in this automation's worktree, detached at `origin/stage`. If `git status --porcelain` is non-empty, stop.
2. Do not touch an `in_progress` row. If any `review` row remains, take the oldest one and stop after this step. Run `node scripts/agent-gate.mjs qa --task <id>`. The script runs the planned test, runs it again with the product files restored, and sets `qa` only when the second run fails. Do not write `## QA` or the index by hand. Do not run `done` in this run.
3. On a later run, when no `review` row remains, take the oldest `qa` row whose `qa` commit is already on `origin/stage` and run `node scripts/agent-gate.mjs done --task <id>`. The command refuses a `qa` commit from the current run.
4. When a command fails, add one defect task tagged for the owning seat and leave the original row in `review`. Do not implement a product fix on this run.
