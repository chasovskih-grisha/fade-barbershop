---
name: accept-review
kind: accept
seat: qa
cron: "12,27,42,57 * * * *"
model: flash_lite
skills: [accept-task]
---

Accept the oldest review task, or file one defect and leave it in review. Load accept-task before editing anything. This run does not implement the fix.
