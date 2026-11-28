# T-4733c · Unsaved-edit prompt on the app

- **Stage**: M1 (phase 3) · **Tags**: mobile, ux · **Complexity**: junior · **Depends on**: T-4733a, T-4732c
- **StoryPoints**: 3

## What

On the app, the visits and devices rows from T-4732c use the same prompt when the name or the note is dirty. The three answers behave as in slice a.

## Why

Those rows are the way off the profile. They are also the way to lose the draft.

## Sources

- T-4733a
- `apps/mobile/src/app/(client)/account/profile/index.tsx`

## Done

- [x] A dirty name asks before «Мої візити»
- [x] «Залишитись» does not open visits

## Risks

- [ ] **A different set of buttons.** The three labels match the site
