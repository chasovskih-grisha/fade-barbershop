# T-4717b · Account control on the app home

- **Stage**: M2 (phase 10) · **Tags**: mobile, ux · **Complexity**: junior · **Depends on**: T-4717a
- **StoryPoints**: 3

## What

Change the "Login" control in `apps/mobile/src/app/index.tsx` to follow slice a.

- Keep the session the login handler already establishes. Do not add a second store and do not change `verifyOtp` or the fixed code.
- Signed out: label "Login", opens the login form.
- Signed in: label "Account", accessible name includes the client name when the session has one, and the press opens `/(client)/account/appointments`.
- "Home" and "My visits" stay.

## Why

The home is the screen a client opens. The label has to match the session that screen already holds.

## Sources

- T-4717a
- `apps/mobile/src/app/index.tsx`

## Done

- [ ] After a successful sign-in the control no longer reads "Login"
- [ ] It opens the visits screen
- [ ] Signed out, the login form still opens from that control

## Risks

- [ ] **The session is only in component state.** Read that state. Do not invent a persistent session for this slice
