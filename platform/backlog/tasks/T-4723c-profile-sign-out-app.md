# T-4723c · Sign out on the app profile

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux, mobile · **Complexity**: junior · **Depends on**: T-4723a, T-4722c
- **StoryPoints**: 3

## What

Add «Вийти» on the app profile. Confirm with the words from slice a. Confirm ends the local session and shows the sign-in form. It does not call push revoke. The push switch from T-4722c remains the only control that revokes the token.

## Why

Today the only exit also disables notifications.

## Sources

- T-4723a
- `apps/mobile/src/app/(client)/account/profile/index.tsx`

## Done

- [ ] «Вийти» and the push switch are different controls
- [ ] Cancel keeps the session
- [ ] Confirm opens sign-in and leaves the push preference stored

## Risks

- [ ] **Revoke-all.** This control does not call `revokeAllSessions`
