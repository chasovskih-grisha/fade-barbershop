# T-4717a · Specify the app account control

- **Stage**: M2 (phase 10) · **Tags**: frontend, ux, mobile · **Complexity**: junior · **Depends on**: T-4717
- **StoryPoints**: 2

## What

Add a short note under «Навігація» in `apps/mobile/index.ts`. It describes the entry control on the home that is in the tree today. It does not replace the tab table.

- No session: the control reads «Вхід» and shows the login form.
- Session: the control reads «Кабінет». Its accessible name is «Кабінет, {ім'я}» when the session has a name, otherwise «Кабінет». Pressing it opens the client visits screen (`(client)/account/appointments`). It does not show the login form.
- «Головна» and «Мої візити» stay as they are.
- The note says the five-tab shell is unchanged and still owned by T-070.

## Why

The tab table has no «Вхід» row, and the screen the client sees does. A one-line note stops the next pass from either deleting the control or rebuilding the shell.

## Sources

- T-4717
- `apps/mobile/index.ts`
- `apps/mobile/src/app/index.tsx`

## Done

- [ ] The note states both states and the visits destination
- [ ] It leaves the tab table in place
- [ ] `pnpm docs:validate` reports no new error from this file

## Risks

- [ ] **Rewriting §1.** The greeting and the next-visit card stay as written. This slice adds the entry-control note only

## Implementation plan

Paths:
- apps/mobile/index.ts

Checks:
- pnpm docs:validate

## Implementation notes

- apps/mobile/index.ts

## QA

- `pnpm docs:validate` exit 0
