# T-4719c · Name field on the app profile

- **Stage**: M1 (phase 3)
- **Tags**: mobile
- **Complexity**: middle
- **Depends on**: T-4719a
- **StoryPoints**: 5

## What

Add the account name to `apps/mobile/src/app/(client)/account/profile/index.tsx`. It reads and writes `PATCH /identity/profile/name`, the same command the site proxies.

The field shows the stored name. Save uses the same empty rule as slice a. Success replaces the value on screen. Failure keeps the typed text and says «Не вдалося зберегти ім'я».

This slice does not remove the push card. It adds the name above it. Later slices replace the token display.

## Why

The app profile currently cannot say who the client is.

## Sources

- T-4719a
- `apps/mobile/src/app/(client)/account/profile/index.tsx`

## Implementation plan

Paths:
- apps/mobile/src/app/(client)/account/profile/index.tsx
- apps/mobile/src/app/(client)/account/profile/profile-styles.ts
- apps/mobile/src/app/(client)/account/profile/index.test.tsx
- apps/mobile/src/lib/api/identity.ts

Checks:
- pnpm --filter mobile test

## Done

- [ ] The profile shows the stored name and can change it
- [ ] An empty save does not clear the name
- [ ] A name saved on the site is the name the app shows on the next load

## Risks

- [ ] **A local-only name.** The field writes the identity profile. It does not store the name in component state alone

## Implementation notes

- apps/mobile/src/app/(client)/account/profile/index.tsx
- apps/mobile/src/app/(client)/account/profile/profile-styles.ts
- apps/mobile/src/lib/api/identity.ts

## QA

- `pnpm --filter mobile test` exit 0
