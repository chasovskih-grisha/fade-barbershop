# T-4733b · Unsaved-edit prompt on the website

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4733a
- **StoryPoints**: 3

## What

When the website profile is dirty as slice a defines, following an aside link to visits, devices, or referrals opens the prompt. «Зберегти» uses the existing section save, then navigates. «Не зберігати» navigates. «Залишитись» does not. A failed save stays on `/account`.

## Why

The aside is how the client leaves the form.

## Sources

- T-4733a
- `apps/web/src/app/account/components/AccountShell.tsx`
- `apps/web/src/app/account/page.tsx`

## Done

- [x] A dirty note asks before «Мої візити»
- [x] A clean profile does not ask
- [x] A failed save stays on the profile

## Risks

- [ ] **Prompting on the header links.** The prompt is for the cabinet aside, not for every link on the public site
