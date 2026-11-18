# Build team

Eleven seats write this repository. Product assistants (concierge, owner analyst, ops) stay in the `assistants` context, ADR 0020. The founder is the human: a task that needs a founder decision stays `todo`.

A run does one job.

- **discover** (product owner at 07:14, 11:14, 15:14, and 19:14, content editor at :16 of those hours, Europe/Kiev) files at most one sourced backlog task, or slices one multi-tag task. It does not edit `apps/` or `packages/`.
- **implement** (four times an hour, seats staggered by two minutes) claims one ready `todo` only after `## Implementation plan` names an owned product path, a test path, and a command that runs that test. A seat keeps one `in_progress` row. `review` requires that product diff and a new test case. The gate writes `## Implementation notes` from that diff.
- **accept** (qa at minutes 12, 27, 42, and 57) runs `qa` for the oldest `review` row. The script runs the planned test, then runs it again with the product files restored; the second run must fail. A later run sets `done` only after that `qa` commit is on `origin/stage`. One run does not do both. An `in_progress` row is not an accept target.

Each automation runs in its own detached worktree, `~/.gemini/worktrees/fade-barber/platform/<automation>`, created from `origin/stage`. Commits are published with `git push origin HEAD:stage`. A start that finds its own worktree dirty exits, so one seat does not run two tasks at once. The human checkout stays on `stage`. The project manager and the conductor have no schedule. A scheduled job must not create a seat or a sidecar.

Seats: `product-owner`, `content-editor`, `project-manager`, `conductor`, `qa`, `backend-developer`, `frontend-developer`, `mobile-developer`, `designer`, `seo`, `devops`.

Paths live in `roles/<seat>/domains/`. Prompts are rendered with `pnpm agents:render`. The model is Flash Lite (`flash_lite`). Check the tree with `pnpm agents:validate`.

The contract is `plans/agent-team/spec.md`.
