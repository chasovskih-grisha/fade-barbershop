# T-4516 · Web/admin: беклог станів екранів (empty/error/offline на web+admin) — компонування

- **Stage**: M1 (phase 3) · **Tags**: frontend · **Complexity**: middle · **Depends on**: T-030, T-4507
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

- [x] Патерн «сторінка = shell + контент + стани» зафіксовано в `docs/design-system.md` (§ «Патерн екрана»), коміт `165704ac`
- [x] Адмін-списки ф2 (локації/каталог/графік) використовують `ListStateRegion`/`ListSkeleton`; кабінет уже має стани з T-4513
- [x] `list-states.test.tsx` (4 тести) і retry-тест календаря `calendar/page.test.tsx`; адмін jest 5 suites / 17 тестів зелений, коміт `6a6ec3cd`
## Implementation plan

Paths:
- apps/admin/src/app/components/ListStateRegion.tsx
- apps/admin/src/app/components/list-states.test.tsx
- apps/admin/src/app/locations/page.tsx
- apps/admin/src/app/services/ServicesManager.tsx
- apps/admin/src/app/services/use-catalog.ts
- apps/admin/src/app/calendar/page.tsx
- apps/admin/src/app/calendar/page.test.tsx
- docs/design-system.md

Checks:
- `npx jest --config apps/admin/jest.config.js --runTestsByPath apps/admin/src/app/components/list-states.test.tsx`

## Implementation notes

- apps/admin/src/app/calendar/page.test.tsx
- apps/admin/src/app/calendar/page.tsx
- apps/admin/src/app/components/ListStateRegion.tsx
- apps/admin/src/app/components/list-states.test.tsx
- apps/admin/src/app/locations/page.tsx
- apps/admin/src/app/services/ServicesManager.tsx
- apps/admin/src/app/services/use-catalog.ts

## QA

- `npx jest --config apps/admin/jest.config.js --runTestsByPath apps/admin/src/app/components/list-states.test.tsx` exit 0
