# T-4527a · Barber profile and configuration (4/8)

- **Stage**: M3 (phase 14) · **Tags**: frontend, design · **Complexity**: middle · **Depends on**: T-023, T-4521, T-4415
- **StoryPoints**: 4

## What
Barber header: name, photo, location, status (active / paused T-4447 / deactivated), role. Schedule block — week editor (T-4415) with current changes and "self-moderation" chip. Services matrix block (T-4521) read mode with transition to editing. Deactivation: reasons and log (MNG-ADM-05 semantics). Active state of the hub in local projections.

## Why
Information half: owner sees and can change barber settings. Without it, stats T-4527b are disconnected from current state (pause/deactivation distorts metrics). Extracted separately because it depends on T-4415/T-4521.

## Sources
- `docs/admin-screens.md` §2 (barber form, §2.2), §2.3 (schedule)
- `backlog/tasks/T-4521` (matrix), `T-4415` (schedule), `T-4447` (pause)
- `docs/design-system.md` §Components

## Done
- [ ] Header + schedule (read) + matrix (read) + deactivation with log
- [ ] Pause state T-4447 correctly displayed
- [ ] Transitions to editing; e2e; `pnpm docs:validate` green
