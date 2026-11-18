# T-4739 · An app visit shows a Ukrainian status, not the enum

- **Stage**: M2 (phase 10) · **Tags**: frontend, ux, mobile · **Complexity**: middle · **Depends on**: T-072
- **StoryPoints**: 7

## What

The app visit row prints `app.status` (`upcoming`, `confirmed`, `completed`, `cancelled`) in hex colors (`#93C5FD`, `#4ADE80`, `#9CA0A8`, `#F87171`). The empty state tells the client to book «через /booking». The header says the client can reschedule, and the row has no such control. The control is T-4740. This task fixes what the row says.

Status text is the Ukrainian label the website cabinet uses for the same status. Colors come from the app theme, not hex and not `accent.blue` as a fill. The empty line does not contain the path `/booking`. The header does not say «переносите» until T-4740 adds that action.

## Why

The visit list is the client's record. An English enum and a route path are not a status and not an instruction.

## Sources

- `apps/mobile/src/app/(client)/account/appointments/list-item.tsx`
- `apps/mobile/src/app/(client)/account/appointments/visits-body.tsx`
- `docs/client-screens.md` §4

## Done

- [x] Slices a and b are `done`
- [x] Each status renders a Ukrainian word
- [x] The row file has no hex color
- [x] The empty state has no `/booking` path
- [x] The header does not promise a reschedule this task does not add

## Risks

- [ ] **Inventing status names.** Use the words the website cabinet already shows for those four states
- [ ] **Adding cancel here.** T-4740 owns the actions. This task only stops promising them

## Out of scope

- Reschedule and cancel actions (T-4740)
- The profile theme task (T-4728). That one is the profile screen. This one is the visit row
