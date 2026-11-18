---
name: discover-task
description: File at most one sourced backlog task, or slice one multi-tag task, and then stop.
---

# Discover one task

Load this skill only for a `discover` run.

1. Stay in this automation's worktree, detached at `origin/stage`. If `git status --porcelain` is non-empty, stop. `git fetch origin stage`, then `git reset --hard origin/stage` when `HEAD` is already contained in it. Publish commits with `git push origin HEAD:stage`.
2. Read open tasks in `backlog/index/` before writing anything.
3. If a task is ready except that its tags include more than one of `backend`, `frontend`, `mobile`, `design`, `seo`, `devops`, slice that one task into single-tag children (`T-xxxxa`, `T-xxxxb`), set the parent to `split`, and stop.
4. Otherwise search for a gap cited by an acceptance criterion, an ADR, a screen spec, or a failing test that no open task already cites.
5. A ready `todo` for that same tag means write nothing. The content editor uses the tag `content`.
6. File at most one task: one file in `backlog/tasks/` plus one index row. Include the source, Done criteria, and a single craft tag.
7. Do not edit `apps/` or `packages/`. Do not implement the task in this run. Do not set a row to `review` or `done`.
