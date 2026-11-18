---
name: implement-task
description: Implement the claimed backlog task inside this seat's paths, prove its Done list, and move it to review.
---

# Implement the claimed task

Load this skill only after `claim-task` succeeded in this same run, or when this seat already has an `in_progress` task.

1. Edit only paths named in that task's `## Implementation plan`, inside this seat's `owns`. A comment, an empty file, a one-line stub, or a markdown note is not an implementation. Do not replace an existing file with one. Add a test case in the planned test file. That case must fail when the product change is absent.
2. Do not start a second task. Do not check Done boxes by hand, and do not write `## Implementation notes` or the journal by hand.
3. Run `node scripts/agent-gate.mjs review --seat <this seat> --task <id>`. The command writes `## Implementation notes` from the diff, sets the row to `review`, and pushes `HEAD:stage`.
4. If the command exits non-zero, stop. Do not mark the task `qa` or `done`.
