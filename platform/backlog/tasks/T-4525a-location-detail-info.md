# T-4525a · Location info blocks (5/13)

- **Stage**: M3 (phase 14) · **Tags**: frontend · **Complexity**: middle · **Dependencies**: T-021, T-4406, T-4507
- **StoryPoints**: 5

## What

Location header ($code, name, status badge, "Edit" CTA → form §1.2). Blocks: contacts/channels/gallery (from T-4406 — credit available context data of locations), working hours with chairs (§1.3/1.4 considering T-4522 if already exists), special dates and temporary closures (T-4414, list of current). Inactive location — reason banner (`isActive=false`).

## Why

Basic half of page: owner sees "what point they own". Without it statistics (T-4525b) has no context. Extracted to separate slice, because contacts/gallery consume T-4406, and hours with chairs — async state from T-021.

## Requirement sources

- `docs/admin-screens.md` §1 (locations), §1.3/1.4 (hours/chairs)
- `backlog/tasks/T-4406` (contacts/gallery), `T-4414` (special dates)
- `docs/design-system.md` §Components (badges, banner)

## Done

- [ ] Header with status and CTA; contacts/channels/gallery blocks
- [ ] Hours with chairs; special dates as list
- [ ] "Lighted"/"disabled" state with reason; e2e test; `pnpm docs:validate` green
