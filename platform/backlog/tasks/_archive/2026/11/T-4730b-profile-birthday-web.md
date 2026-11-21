# T-4730b · Birthday on the website profile

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4730a
- **StoryPoints**: 3

## What

Add day and month selectors to the website profile. Persist them on the client profile. "Clear" removes them. There is no year selector. Saving does not call a campaign or notification API.

## Why

The website profile is the account form.

## Sources

- T-4730a
- `apps/web/src/app/account/page.tsx`

## Done

- [x] A saved day and month reload as "12 November" for 12 November
- [x] Clear removes them
- [x] No campaign request is made

## Risks

- [x] **31 February.** Impossible days are not selectable for the chosen month
