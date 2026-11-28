# T-4717 · The app stops offering login once the client is in

- **Stage**: M2 (phase 10)
- **Tags**: mobile
- **Complexity**: middle
- **Depends on**: T-070
- **StoryPoints**: 5

## What

The client home that is on screen today (`apps/mobile/src/app/index.tsx`) has three controls: «Home», «Sign in», «My visits». After OTP succeeds, «Sign in» still says «Sign in». It only switches the tab back to home.

Once a session exists, that control is the cabinet. It reads «Account» and opens `/(client)/account/appointments`. Signed out, it stays «Sign in» and opens the login form, as it does now.

This does not build the five-tab shell in `docs/client-screens.md`. T-070 owns that shell and is already `done`. This task changes the control the running home actually renders.

## Why

A client who has signed in still sees a login tab. The website header has the same hole (T-4715). The app should not keep a door marked «Sign in» after the client is through it.

## Sources

- `apps/mobile/src/app/index.tsx`
- `docs/client-screens.md` §Navigation
- ADR 0005

## Implementation plan

Paths:
- apps/mobile/src/app/index.tsx
- apps/mobile/src/app/index-nav.tsx
- apps/mobile/src/app/index-account-entry.test.tsx

Checks:
- pnpm --filter mobile test

## Done

- [ ] Slices a and b are `done`
- [ ] With a session, the control reads «Account» and opens the visits screen
- [ ] Without a session, it still reads «Sign in» and opens the login form

## Risks

- [ ] **Rebuilding the shell.** The spec lists Home, Locations, Services, My visits, Profile. Those tabs are not this task. Only the «Sign in» control changes
- [ ] **The demo code.** `handleLogin` verifies a fixed code. Leave it. Identity is not this task

## Audit 2026-11-24

Reopened to `in_progress`: the parent was marked `done` while slice b
(`T-4717b`, the actual home control) is still `review`, and none of the parent Done
boxes are checked. The parent cannot close before its UI slice is accepted.

## Out of scope

- The five-tab shell, the greeting, and the next-visit card on the home. Those are already specified for the shell
- The website header (T-4715)
- The barber side of the app
- A photo or an initials circle. The app home has no avatar component. The change is the label and the destination

## Implementation notes

- apps/mobile/src/app/index.tsx

## QA

- `pnpm --filter mobile test` exit 0
