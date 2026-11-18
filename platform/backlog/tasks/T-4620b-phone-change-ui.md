# T-4620b · Phone change on the site and in the app

- **Stage**: M1 (phase 1) · **Tags**: frontend, identity · **Complexity**: middle · **Depends on**: T-4620a, T-032, T-072
- **StoryPoints**: 5

## What

The account screen on the site and the profile screen in the app let the signed-in client replace their phone.

- The current number is shown and is not an editable text field.
- The flow asks for the new number, sends a code, and asks for the code. Wrong code stays on the step. A number that already belongs to someone else shows that it cannot be used, without naming the other person.
- Success ends the session and returns the client to sign-in. The next sign-in uses the new number.
- The two products call the same command. The app does not store a second phone field locally.

## Why

The command is useless if the only place it exists is the API. Both clients of the same user have to offer it, or one of them will look like the account was lost.

## Sources

- T-4620a
- `docs/client-screens.md` §5
- T-032, T-072

## Done

- [x] Site account and app profile both start the flow
- [x] A collision does not reveal the other account
- [x] Success lands on sign-in, and the new number works
- [x] Tests cover a wrong code, a collision, and success

## Risks

- [ ] **Keeping the old session on screen.** After success the UI must drop the token. A profile that still shows the old number is a failed change

## Out of scope

- OTP delivery infrastructure — T-010 and T-4400
- The domain command — **T-4620a**
