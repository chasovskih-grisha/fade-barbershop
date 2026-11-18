# T-4726a · Specify the missing-name prompt

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4726
- **StoryPoints**: 2

## What

Add the prompt to `docs/web-cabinet-screens.md` §2 and point `docs/client-screens.md` §5 at it.

- Shown only when the stored name is empty.
- Copy: «Як до вас звертатись?»
- The heading fallback «Клієнт» is display-only and is never saved.
- The prompt is not a modal. Other profile sections remain usable.

## Why

«Клієнт» is a fallback in the shell today. The docs do not say it must not be stored, or that the profile should ask.

## Sources

- T-4726
- `docs/web-cabinet-screens.md` §2

## Done

- [ ] §2 states the prompt, the fallback, and that it is not a gate
- [ ] §5 points at §2
- [ ] `pnpm docs:validate` reports no new error from these files

## Risks

- [ ] **A required-name change to OTP.** Sign-in stays phone plus code. The ask happens on the profile
