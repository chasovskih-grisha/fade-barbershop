# T-4510 · a11y-харнес: axe-core + фокус/кінетика

- **Stage**: M1 (phase 3) · **Tags**: frontend, quality · **Complexity**: senior · **Depends on**: T-004, T-030
- **StoryPoints**: 8

## What

Поставити доступність у гейт з початку роботи з екранами, а не на M5-аудит (T-3501):
- `axe-core` автоматично прогоняється на публічних сторінках (web) у CI (Playwright-крок або окремий скрипт); поріг — 0 критичних/серйозних
- Патерни фокусу: видимий `focus-visible` з токенів, focus-trap у модалках/Sheet, skip-link на сайті
- Підтримка `prefers-reduced-motion` у компонентах з анімацією (транзиції не рухають інтерфейс при on)
- `<html lang="uk">` (у адмінці зараз `en` — Fix)

## Why

T-3501 (повний WCAG-аудит) стоїть у M5 — після запуску. Щоб ф2–ф3 екрани не накопичували а11y-борг, який потім виправляється регресами, потрібен безперервний гейт. `docs/ux-guidelines.md` і `review-checklist.md` вже закріплюють мову/семантику/фокус — ця задача робить їх автоматичною перевіркою.

## Sources

- `docs/ux-guidelines.md` §Доступність (lang=uk, aria, фокус, семантика)
- `docs/review-checklist.md` §UI
- `docs/accessibility`-рівень T-3501 (джерело приймається на старті)
- `apps/web`, `apps/admin` (поточні layout)

## Done

- [ ] axe-core прогон у CI на публічних сторінках, 0 критичних/серйозних
- [ ] `prefers-reduced-motion` підтримується в анімованих компонентах `@fade/ui`
- [ ] Focus-видимість, focus-trap у Sheet/Modal, skip-link на сайті
- [ ] `lang="uk"` у web і admin; юніт/е2е-Tests на ключові патерни

## Risks

- [ ] axe знаходить борг у вже зроблених екранах T-030 — фіксується в тій же задачі (екрани ф3 ще не написані, тому гейт «з першого дня»)

## Розбивка (слайси, 8 SP)

1. **T-4510a · axe-core у CI + lang/структурна a11y** *(senior, 3 SP)* — поріг 0 крит/серйозних, `lang="uk"`.
2. **T-4510b · Фокус-патерни** *(middle, 3 SP)* — focus-visible, focus-trap у Sheet/Modal, skip-link.
3. **T-4510c · prefers-reduced-motion + анімація** *(junior, 2 SP)* — політика zero-motion, `useReducedMotion`.

## Re-verified at 91202f68

Umbrella `todo`: T-4510a and T-4510b both carry `Depends on: T-4510`, so `claimBlock` refuses them
while the parent is open (`m1.md:130`). The parent needs the axe CI wiring and the focus-pattern
slices finished first; nothing here is blocked by missing code, only by ordering.
