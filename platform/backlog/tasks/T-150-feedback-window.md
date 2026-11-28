# T-150 · FeedbackWindow: subscription, 2-h push

- **Stage**: M4 (phase 12A — v1 slice per decision) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-042, T-080
- **StoryPoints**: 5

## What

`FeedbackWindow` on `AppointmentCompleted` (idempotent subscription — ADR 0016): 30-day window, `windowEndsAt` — setting snapshot; statuses open/submitted/expired/closed; submission → `Review` (stars required, text ≤ 1000, ≤ 3 photos — ADR 0015 for photos), resubmission edits (FDB-002); reminder after 2h — exactly one (FDB-MOB-02); review deletion until end of window (FDB-003). Private in first release (FDB-006 accepted); publication — phase 25.

## Sources

- `FDB-001…006` + surfaces; **ADR 0015/0016**; feedback README

## Implementation plan

Paths:
- apps/api/prisma/schema.prisma
- apps/api/prisma/migrations/20261127030000_add_feedback_request_window/migration.sql
- apps/api/src/feedback/window/domain/feedback-window.ts
- apps/api/src/feedback/window/application/ports.ts
- apps/api/src/feedback/window/application/feedback-window.service.ts
- apps/api/src/feedback/window/application/feedback-window.inputs.ts
- apps/api/src/feedback/window/application/feedback-window.view.ts
- apps/api/src/feedback/window/application/feedback-window.memory-repo.ts
- apps/api/src/feedback/window/application/feedback-window.window.spec.ts
- apps/api/src/feedback/window/application/feedback-window.submission.spec.ts
- apps/api/src/feedback/window/application/appointment-completed-subscriber.ts
- apps/api/src/feedback/window/application/appointment-completed-subscriber.spec.ts
- apps/api/src/feedback/window/infrastructure/prisma-feedback-window.repository.ts
- apps/api/src/feedback/window/infrastructure/client-feedback-window.controller.ts
- apps/api/src/feedback/window/infrastructure/admin-feedback-window.controller.ts
- apps/api/src/feedback/window/infrastructure/feedback-window-http.mapper.ts
- apps/api/src/feedback/window/feedback-window.module.ts
- apps/api/src/feedback/window/README.md
- apps/api/src/app.module.ts

Checks:
- `npx jest --config apps/api/jest.config.js --runTestsByPath apps/api/src/feedback/window/application/feedback-window.window.spec.ts apps/api/src/feedback/window/application/feedback-window.submission.spec.ts apps/api/src/feedback/window/application/appointment-completed-subscriber.spec.ts`

## Done

- [x] Window opens on completed visit, once
- [x] Photos in separate bucket with review lifecycle — винесено в **T-150a** (бакет `feedback-photos` створює інфраструктура, коду запису/прибирання немає; тут лишаються тільки посилання `{id, sortOrder}`)

## Risks

- [x] **30-day window**: idempotent creation of FeedbackWindow — ADR 0016 pattern

## Implementation notes

- apps/api/src/feedback/window/application/appointment-completed-subscriber.spec.ts
- apps/api/src/feedback/window/application/appointment-completed-subscriber.ts

## QA

- `npx jest --config apps/api/jest.config.js --runTestsByPath apps/api/src/feedback/window/application/feedback-window.window.spec.ts apps/api/src/feedback/window/application/feedback-window.submission.spec.ts apps/api/src/feedback/window/application/appointment-completed-subscriber.spec.ts` exit 0
