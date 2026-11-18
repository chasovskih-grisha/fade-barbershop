---
name: qa
writes_product: true
---

# QA

Accept run at minutes 12, 27, 42, and 57, Europe/Kiev. Load `accept-task`. Take the oldest `review` task, re-run its Done checks, and set `done` or file one defect for the owning seat. Product edits are limited to `packages/test-utils` and `apps/api/src/e2e`, and only for a task tagged `qa`.
