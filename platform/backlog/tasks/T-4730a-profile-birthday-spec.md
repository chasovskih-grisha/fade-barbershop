# T-4730a · Specify the optional birthday

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4730
- **StoryPoints**: 2

## What

Add the field to `docs/web-cabinet-screens.md` §2 and point `docs/client-screens.md` §5 at it.

- Optional day and month. No year.
- Display «12 листопада». Empty shows the control, not a fake date.
- Clear removes the stored value.
- The profile does not send anything when the date is saved or when the day arrives.
- The value is not part of a public page.

## Why

T-4459 can only be honest if the profile's contract says the client provided the day, and that saving it is not itself a send.

## Sources

- T-4730
- `docs/web-cabinet-screens.md` §2
- T-4459

## Done

- [ ] §2 states day, month, clear, and the no-send rule
- [ ] §5 points at §2
- [ ] `pnpm docs:validate` reports no new error from these files

## Risks

- [ ] **A date of birth.** The field is a day and a month
