# T-4727 · Each profile section saves on its own

- **Stage**: M1 (phase 3) · **Tags**: frontend, ux · **Complexity**: middle · **Depends on**: T-032
- **StoryPoints**: 10

## What

The website profile uses one `saving` flag and one banner for the name, the preferences, and the notification switches. Saving a name disables the other buttons. The banner says «Збережено» or «Помилка збереження» without saying which section.

Each section has its own pending state and its own result. Success is «Ім'я збережено», «Вподобання збережено», or «Сповіщення збережено». Failure is «Не вдалося зберегти ім'я», «Не вдалося зберегти вподобання», or «Не вдалося зберегти сповіщення», next to that section. One failure does not roll back another section that already succeeded.

The app profile uses the same three sentences for the sections it has.

## Why

A single banner makes a failed preference save look like the name was lost, and it freezes the rest of the form.

## Sources

- `apps/web/src/app/account/page.tsx`
- `docs/web-cabinet-screens.md` §2

## Done

- [ ] Slices a, b, and c are `done`
- [ ] Saving the name leaves the preference button usable
- [ ] A preference error does not change the name banner

## Risks

- [ ] **Autosave on every keystroke.** Each section still has an explicit save. This task only separates them
- [ ] **A toast stack.** The message sits in the section

## Out of scope

- The name rules (T-4719) and the preference limits (T-4721). This task is the feedback around those saves
