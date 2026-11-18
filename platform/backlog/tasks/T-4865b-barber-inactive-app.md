# T-4865b · Slice: an inactive barber in the app

- **Stage**: M5 (phase 30) · **Tags**: frontend, ux, mobile · **Complexity**: junior · **Depends on**: T-4865, T-4867
- **StoryPoints**: 3

## What

The app list hides inactive barbers. A direct open shows the name, the explanation, and a way back to the list. No book control.

## Why

A deep link can outlive the job.

## Sources

- T-4865
- T-4867

## Done

- [ ] The list skips `active: false`
- [ ] The direct open has no book control
- [ ] A test covers both

## Risks

- [ ] **A missing flag.** When the payload has no `active`, the person is shown. This task does not guess

## Out of scope

- The website page (T-4865a)
