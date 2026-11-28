# T-4524 · Admin Calendar: Drag & Drop, Bulk Reschedule, Quick Actions

- **Stage**: M1 (phase 4) · **Tags**: frontend · **Complexity**: middle · **Depends on**: T-045, T-042, T-4507
- **StoryPoints**: 8

## What

Elevate the network calendar (T-045) from a view to an operator working tool:
- **drag & drop** appointment from slot to slot (reschedule via `Appointment.reschedule`, same validations), moving appears as unavailable target slide/dead/occupied
- **bulk selection** of appointments (Ctrl/Shift/marker) → shared action: reschedule, cancel (with reason, T-4474), change status, send reminder
- **quick actions** on card: copy data, "book this client again" (draft step 1), open in cabinet
- Keyboard: arrows between slots, Enter → actions; unavailability state — from tokens, without hex

## Why

T-045 is the main workplace of the admin/operator. Without drag & drop and bulk operations, handling a high-volume network creates heavy operator fatigue and mistakes.

## Sources

- `docs/admin-screens.md` §5 (calendar)
- `docs/ux-guidelines.md` (keyboard navigation, drag & drop)
- `backlog/tasks/T-045` (base calendar)

## Done

- [ ] Drag & drop with validation and rescheduling backend integration
- [ ] Bulk selection and batch actions (reschedule, cancel, status change)
- [ ] Card quick actions (repeat booking, copy client info)
- [ ] Keyboard navigation and accessibility (tokens only, no hex)
- [ ] e2e tests & component tests passing (`pnpm --filter admin test`)

## Risks

- [ ] **Slot concurrency**: race condition when two operators drag to the same slot simultaneously (handled by optimistic locking / retry)
