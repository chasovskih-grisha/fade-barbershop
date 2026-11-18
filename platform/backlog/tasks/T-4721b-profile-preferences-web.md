# T-4721b · Show the preference limit before save

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-4721a
- **StoryPoints**: 5

## What

On the website preferences card, count lines the way the route does: trim, drop empty lines. If there are more than 20, or any line is longer than 100 characters, disable save is wrong — keep save enabled only when the text is valid and changed, and show «Не більше 20 рядків, до 100 символів у рядку» under the field. Do not POST.

A saved empty textarea clears the list. The hint stays.

## Why

The card already edits the note. It waits for an English 400 to explain the limit.

## Sources

- T-4721a
- `apps/web/src/app/account/AccountPreferencesCard.tsx`
- `apps/web/src/app/account/page.tsx`

## Done

- [ ] 21 lines do not call the route
- [ ] A 101-character line shows the Ukrainian sentence
- [ ] A note within the limit still saves

## Risks

- [ ] **Counting the raw textarea.** Blank lines the route would drop do not count toward 20
