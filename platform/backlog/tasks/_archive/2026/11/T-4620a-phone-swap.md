# T-4620a · Swap the phone on the same user

- **Stage**: M1 (phase 1) · **Tags**: backend, identity, security · **Complexity**: middle · **Depends on**: T-010
- **StoryPoints**: 8

## What

`ChangePhone` on the signed-in client:

1. `RequestOtp` for the new number, purpose distinct from login, so the message is not the sign-in template.
2. `VerifyOtp` on that number.
3. In one transaction, move `PhoneNumber` onto the current `User`, clear it from any unverified challenge, and revoke other sessions for this user.
4. If another user already owns the verified number, stop. No write.
5. Appointments, loyalty, and the CRM profile keep their user id. Nothing is copied.

The old number can later be used to register a different person. Until this command commits, it still signs into the original user.

A repeated verify of an already-used code does not swap twice.

## Why

The invariant is identity, not the SMS. The number is a key. The person is the row.

## Sources

- T-4620
- ADR 0005
- T-010

## Done

- [ ] A verified new number replaces the old one on the same user id
- [ ] Visits remain addressable by that user id
- [ ] The old number fails OTP sign-in
- [ ] A number owned by another user is rejected and both users are unchanged
- [ ] Other sessions for this user no longer authorize requests
- [ ] Tests cover success, collision, and a reused code

## Risks

- [ ] **Purpose mix-up.** A login code must not complete a phone change. The purpose is checked, not only the digits
- [ ] **Partial write.** Number update and session revoke commit together

## Out of scope

- The form — **T-4620b**
- Admin editing a client's phone by hand. That would bypass OTP and is not allowed here

## Implementation plan

Checks:
- `apps/api/src/identity/application/change-phone.verify.spec.ts`
- `pnpm --filter api test -- src/identity/application/change-phone.verify.spec.ts`

## QA

- `apps/api/src/identity/application/change-phone.verify.spec.ts` exit 0
- `pnpm --filter api test -- src/identity/application/change-phone.verify.spec.ts` exit 0


