---
name: claim-task
description: Sync this worktree to origin/stage, claim one ready todo, and stop if the tree is dirty.
---

# Claim one task

Load this skill at the start of an `implement` run, before any product edit.

1. Stay in this automation's worktree. It is detached at `origin/stage`. Do not create a branch. Do not checkout `stage`.
2. If this seat already has an `in_progress` task, do not claim. Implement that task.
3. On the oldest ready `todo`, write this section in its task file before claiming:

```markdown
## Implementation plan

Paths:
- <product path under this seat's owns>
- <test path under this seat's owns>

Checks:
- <command that runs that test file>
```

The test must fail when the product change is absent. A command that already passes, including the whole package suite, does not count.

4. Run `node scripts/agent-gate.mjs claim --seat <this seat>`. The command commits that plan and sets the row to `in_progress`. A seat with another `in_progress` row is refused. If it prints `none`, stop. That is a successful run.
