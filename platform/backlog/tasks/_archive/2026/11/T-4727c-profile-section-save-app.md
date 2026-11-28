# T-4727c · The same save sentences on the app

- **Stage**: M1 (phase 3) · **Tags**: mobile, ux · **Complexity**: junior · **Depends on**: T-4727a, T-4719c, T-4721c
- **StoryPoints**: 3

## What

The app profile shows the sentences from slice a on the name section and the preference section. A failure in one does not clear the other.

## Why

The app would otherwise invent a third wording for the same save.

## Sources

- T-4727a
- `apps/mobile/src/app/(client)/account/profile/index.tsx`

## Implementation plan

Paths:
- apps/mobile/src/app/(client)/account/profile/save-sentences.ts
- apps/mobile/src/app/(client)/account/profile/use-name-draft.ts
- apps/mobile/src/app/(client)/account/profile/use-note-draft.ts
- apps/mobile/src/app/(client)/account/profile/name-card.tsx
- apps/mobile/src/app/(client)/account/profile/note-card.tsx
- apps/mobile/src/app/(client)/account/profile/save-sections.test.tsx

Checks:
- `npx jest --config apps/mobile/jest.config.js --runTestsByPath "apps/mobile/src/app/(client)/account/profile/save-sections.test.tsx"`

## Done

- [ ] Name and preference results use the §2 sentences
- [ ] One failure leaves the other section's text in place

## Risks

- [ ] **A shared snackbar.** The message stays in the section

## Implementation notes

- apps/mobile/src/app/(client)/account/profile/name-card.tsx
- apps/mobile/src/app/(client)/account/profile/note-card.tsx
- apps/mobile/src/app/(client)/account/profile/save-sections.test.tsx
- apps/mobile/src/app/(client)/account/profile/save-sentences.ts
- apps/mobile/src/app/(client)/account/profile/use-name-draft.ts
- apps/mobile/src/app/(client)/account/profile/use-note-draft.ts

## QA

- `npx jest --config apps/mobile/jest.config.js --runTestsByPath "apps/mobile/src/app/(client)/account/profile/save-sections.test.tsx"` exit 0
