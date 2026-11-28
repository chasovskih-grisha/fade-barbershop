# T-4722c · The same switches on the app profile

- **Stage**: M1 (phase 3) · **Tags**: mobile, ux · **Complexity**: middle · **Depends on**: T-4722a
- **StoryPoints**: 5

## What

Replace the token row on the app profile with the four switches from slice a. They read and write the same profile values as the site.

The push switch calls the existing register and revoke helpers. Revoke does not sign the client out. The token string is not on screen. "Sign out" is not this button. Sign-out is T-4723. Until that slice lands, do not label the push action "Sign out".

## Why

The app shows a credential and a combined logout. The site shows switches that do not save. Neither is the setting.

## Sources

- T-4722a
- `apps/mobile/src/app/(client)/account/profile/index.tsx`

## Done

- [ ] The token string is gone
- [ ] The four switches match a site save
- [ ] Turning push off leaves the session in place

## Risks

- [ ] **A new push stack.** Use the register and revoke helpers already on this screen
