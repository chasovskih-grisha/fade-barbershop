# T-4719a · Specify the shared account name

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4719
- **StoryPoints**: 2

## What

Add the name rule to `docs/web-cabinet-screens.md` §2 and point `docs/client-screens.md` §5 at the same rule. Do not write a second rule in different words.

- One name for the site and the app. Source is the identity profile.
- Save trims. Empty after trim is «Вкажіть ім'я» and does not replace the stored name.
- After a successful save the open screen shows the stored name, including the cabinet heading on the site.
- The client never sees the English validation string from the web route.

## Why

The two screen docs already mention an editable name. They do not say that a save has to show up, or that an empty value is not a clear.

## Sources

- T-4719
- `docs/web-cabinet-screens.md` §2
- `docs/client-screens.md` §5

## Done

- [ ] Both docs describe one name and the empty-name refusal
- [ ] The app section points at the cabinet rule instead of restating it
- [ ] `pnpm docs:validate` reports no new error from these files

## Risks

- [ ] **Two contracts.** A later change to the name rule lands in §2. §5 only points at it
