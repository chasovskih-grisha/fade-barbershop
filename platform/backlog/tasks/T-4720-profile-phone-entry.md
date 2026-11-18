# T-4720 · The profile offers the phone change that already exists

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux, identity · **Complexity**: middle · **Depends on**: T-4620b, T-032, T-072
- **StoryPoints**: 12

## What

`POST /identity/phone/change/request` and `POST /identity/phone/change/verify` already replace the phone on the same user (T-4620). T-4620b is marked done. The account card still says «Зміна номера — через підтримку», and the app profile has no phone row.

Put that existing flow on both profile screens. Do not add a second OTP or a second user. The number on screen is not a free-text field. «Змінити номер» asks for the new number, then the code. A number owned by someone else is refused without naming them. Success follows T-4620b: the client lands on sign-in, and the next sign-in uses the new number. Other sessions are already revoked by the command. The screen does not revoke them again.

Remove the support sentence.

## Why

A finished command that the profile hides sends the client to support for a change the product already performs.

## Sources

- T-4620b
- `apps/web/src/app/account/AccountProfileCard.tsx`
- `apps/api/src/identity/infrastructure/change-phone.controller.ts`
- `docs/client-screens.md` §5
- ADR 0005

## Done

- [ ] Slices a, b, and c are `done`
- [ ] Neither profile tells the client to change the number through support
- [ ] A collision does not name the other account
- [ ] Success leaves the profile and the next sign-in uses the new number

## Risks

- [ ] **A second flow.** If a phone-change component already exists and is unwired, wire it. If it was lost, restore the behavior T-4620b describes
- [ ] **Revoking the current session twice.** The command keeps the current session and revokes the others. The screen then ends the local session, as T-4620b already requires

## Out of scope

- The domain swap (T-4620a) and OTP delivery
- Admin editing a client's phone
- Merging two clients who share a number
