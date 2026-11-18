# T-4428 · Push Notifications with Deep Navigation

- **Stage**: M2 (phase 5) · **Tags**: mobile, notifications · **Complexity**: middle · **Depends on**: T-070, T-080
- **StoryPoints**: 3

## What

Push notifications (T-080) with destination screen mapping: "tomorrow at 14:30" reminder opens booking card, payment status opens receipts, "new review" opens feedback. Route schema is passed in push payload, deep-link router (T-4427) consumes it; unknown/outdated route triggers fallback.

## Why

A push that does not open anything is noise; a push that opens the wrong screen is a bug. Routes are formed on the server side upon dispatch.

## Sources

- client-screens.md; notifications README; T-080/T-4427 (upper chain)

## Done

- [ ] Push routes: booking/payment/review/chat open navigation
- [ ] Pre-opened deep-link page is correct when session is inactive
- [ ] Unknown route → main screen without crash (tested)

## Risks

- [ ] **Route leak**: push with token (T-4418) is anonymized, does not carry a complete block
