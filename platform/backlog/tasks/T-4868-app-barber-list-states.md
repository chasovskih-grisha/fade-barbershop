# T-4868 · The app barber directory has a skeleton, an empty line, and an error

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, mobile · **Complexity**: junior · **Depends on**: T-4866
- **StoryPoints**: 3

## What

The directory’s loading state is portrait-shaped skeletons. An empty payload is one sentence that there are no barbers yet. A failed request is an error sentence and a retry. The error is not the empty sentence.

## Why

A failed load that looks like an empty team tells the guest the shop has no one.

## Sources

- T-4866
- T-4846 (the same three states for locations)

## Done

- [ ] Loading shows skeletons
- [ ] An empty array shows the empty sentence
- [ ] A thrown fetch shows the error and retry
- [ ] A test covers the three states

## Risks

- [ ] **One failed studio blanking the directory.** A failed location request is the directory error. It does not render a partial list as if it were everyone

## Out of scope

- The offline cache (T-4429)
- The website empty state (T-4513)
