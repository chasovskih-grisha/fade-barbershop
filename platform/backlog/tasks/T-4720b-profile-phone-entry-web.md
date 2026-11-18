# T-4720b · Phone change from the website account card

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux, identity · **Complexity**: middle · **Depends on**: T-4720a
- **StoryPoints**: 5

## What

Replace the support hint on `AccountProfileCard` with «Змінити номер». The flow calls `POST /identity/phone/change/request` and `POST /identity/phone/change/verify`.

Wrong code stays on the code step. `PhoneTaken` shows that the number cannot be used and does not include another client's name. Success clears the local session and opens `/login`.

The phone input on the card stays read-only.

## Why

The card is the account section clients actually open, and it still refuses the change.

## Sources

- T-4720a
- `apps/web/src/app/account/AccountProfileCard.tsx`
- `apps/api/src/identity/infrastructure/change-phone.controller.ts`

## Done

- [ ] The support sentence is gone
- [ ] Wrong code, collision, and success match slice a
- [ ] Tests cover those three

## Risks

- [ ] **Sending the login OTP.** Login OTP and phone-change OTP are different purposes. This screen uses `identity/phone/change`
