# T-4510c · prefers-reduced-motion + анімація (2/8)

- **Stage**: M1 (phase 3) · **Tags**: frontend · **Complexity**: junior · **Depends on**: T-4507
- **StoryPoints**: 2

## What
`prefers-reduced-motion` у `apps/web` і `apps/admin`: CSS `@media (prefers-reduced-motion: reduce)` вимикає/гальмує переходи, декларативна політика (без JS-суперпозицій), іменовані transition-токени якщо є. Нові анімовані компоненти (Toast, Modal, Sheet, Select dropdown) поважають налаштування «без руху»; у `packages/ui` використаний зручний хук `useReducedMotion`.

## Why
Вестибулярні/кінетичні розлади: скорочення руху — частина WCAG 2.3.3 (AAA) і O вже має токени анімації; без політики «zero-motion» ф2-ф3 екрани почнуть анімувати, що відштовхує частину клієнтів (і порушує T-3501 на старті).

## Sources
- `docs/ux-guidelines.md` §Доступність (редукований рух)
- `docs/design-system.md` §Токени (motion, якщо заведені)
- WCAG 2.3.3 (reduced motion); `packages/ui` (Toast/Modal/Sheet)

## Done
- [x] `prefers-reduced-motion`-політика в web/admin, анімації поважають reduce
- [x] `useReducedMotion` у `@fade/ui` для JS-анімацій
- [x] Перевірка: увімкнено reduce → Toast/Sheet/Select не рухаються