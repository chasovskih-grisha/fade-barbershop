# T-4731c · Saved-note quote on the app

- **Stage**: M1 (phase 3) · **Tags**: mobile, ux · **Complexity**: junior · **Depends on**: T-4731a, T-4721c
- **StoryPoints**: 3

## What

Under the app preference field, render the same quote and the same empty sentence, bound to the last saved note.

## Why

The app note would otherwise be a box with no proof of what was stored.

## Sources

- T-4731a
- `apps/mobile/src/app/(client)/account/profile/index.tsx`

## Done

- [x] The quote matches a note saved on the site
- [x] Unsaved typing on the app leaves it unchanged

## Risks

- [ ] **Different empty copy.** Use «Майстер ще нічого не побачить»

## Implementation plan

The quote and its draft already ship in the review commit; the plan names the
files so the gate can see the test that covers them.

Paths:
- `apps/mobile/src/app/(client)/account/profile/note.ts`
- `apps/mobile/src/app/(client)/account/profile/note-card.test.tsx`

Checks:
- `npx jest --config apps/mobile/jest.config.js --runTestsByPath 'apps/mobile/src/app/(client)/account/profile/note-card.test.tsx'`

## QA

- `npx jest --config apps/mobile/jest.config.js --runTestsByPath 'apps/mobile/src/app/(client)/account/profile/note-card.test.tsx'` exit 0
