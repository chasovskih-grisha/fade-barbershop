# T-4726b · Missing-name prompt on the website

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-4726a, T-4719b
- **StoryPoints**: 3

## What

When `user.name` is empty, render «Як до вас звертатись?» above the name field on the website profile. Do not render it when a name is stored. Do not put «Клієнт» into the field.

## Why

The field is already on the page. Nothing tells a nameless client that it matters.

## Sources

- T-4726a
- `apps/web/src/app/account/AccountProfileCard.tsx`

## Done

- [ ] Empty name shows the prompt
- [ ] A stored name does not
- [ ] The field value is empty, not «Клієнт»

## Risks

- [ ] **Blocking the aside.** Visits and devices stay reachable
