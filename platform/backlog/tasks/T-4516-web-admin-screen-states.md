# T-4516 · Web/admin: беклог станів екранів (empty/error/offline на web+admin) — компонування

- **Stage**: M1 (phase 3) · **Tags**: frontend, design · **Complexity**: middle · **Depends on**: T-030, T-4507
- **StoryPoints**: 5

## What

Застосувати таблицю станів `ux-guidelines.md §Стани` до існуючих web і admin екранів (T-030, T-032, T-020, адмін-списки ф2): loading → Skeleton (не спіннер), empty → EmptyState+CTA, error → AlertBanner+Retry, offline → `navigator.onLine`-повідомлення. Скласти патерн-компонування «сторінка = shell + контент-регіон + стани» у design-system.md, щоб усі ф3–ф5 екрани брали потрібний стан системно, а не поштучно.

## Why

Після T-4513 (web-стани для публічних сторінок) лишаються адмін-списки (ф2) і кабінет (T-032): вони теж мають empty/error/offline стани, інакше «none записів» виглядає як порожня таблиця без повідомлення. Це закриває прогалину покриття станів усього v1-масиву (web+admin).

## Sources

- `docs/ux-guidelines.md` §Стани (таблиця loading/empty/error/offline)
- `docs/admin-screens.md`, `docs/web-cabinet-screens.md`
- `docs/design-system.md` §Компоненти (Skeleton/EmptyState/AlertBanner — T-4507 серія)

## Done

- [ ] Патерн «сторінка = shell + контент + стани» зафіксовано в design-system.md
- [ ] Адмін-списки ф2 (локації/каталог/графік) і кабінет T-032 використовують Skeleton/Empty/Error/Retry
- [ ] Offline-pації на web; юніт/візуальні Tests на стани