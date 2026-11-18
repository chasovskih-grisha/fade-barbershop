# T-4620 · The client can change their phone number

- **Stage**: M1 (phase 1) · **Tags**: backend, identity, security · **Complexity**: senior · **Depends on**: T-010
- **StoryPoints**: 13

## What

The login is the phone number (ADR 0005). The profile screen already says the number is read-only until a new number is confirmed with OTP. Nothing in the backlog does that confirmation.

Changing the number must keep the same `User`. Visits, loyalty, deposits, and the client profile stay put. The old number stops signing in. The new number is not allowed to belong to someone else.

This is not a second account and not a merge of two clients.

## Why

A new SIM is ordinary. Without this path the client loses their history, or support creates a duplicate person and the chair history splits.

## Sources

- ADR 0005
- `docs/client-screens.md` §5 (phone is the identity; a change is a fresh OTP on the new number)
- T-010 (request and verify OTP)
- T-4423 (merging duplicates). This epic must not create the duplicate that task later cleans up

## Done

- [ ] Slices a and b are `done`
- [ ] After a successful change, the old number cannot sign in and the new number opens the same user
- [ ] Visits booked before the change are still on that user

## Risks

- [ ] **Two users, one number.** Reject the change when the new number is already verified on another user. Do not auto-merge
- [ ] **Stolen session.** Completing the change revokes other sessions. The user signs in again with the new number

## Out of scope

- Merging two existing clients — **T-4423**
- Staff and admin logins. Those are not phone-OTP clients
- SMS provider production setup — **T-4400**. Dev may use the existing console or Mailpit OTP

## Implementation plan

Paths:
- apps/api/src/identity

Checks:
- pnpm --filter api test apps/api/src/identity/e2e/change-phone.e2e.spec.ts

## Implementation notes

- apps/api/src/identity/e2e/change-phone.e2e.spec.ts

## QA

- `pnpm --filter api test apps/api/src/identity/e2e/change-phone.e2e.spec.ts` exit 0
