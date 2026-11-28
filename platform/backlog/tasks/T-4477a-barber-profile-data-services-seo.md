# T-4477a · Дані профілю, послуги з цінами, SEO і стани сторінки барбера (5/8)

- **Stage**: M5 (phase 19) · **Tags**: frontend, portfolio · **Complexity**: middle · **Depends on**: T-4413, T-4610b, T-4513, T-4507d
- **StoryPoints**: 5

## What

scaffold сторінки барбера без CTA — усе, що робить сторінку **правдивою**: справжній slug, справжнє фото, справжня біографія, послуги з цінами, SEO-розмітка, стани екрана. CTA з предвибором — T-4477b.

Сторінка вже є (`apps/web/src/app/barbers/[slug]/page.tsx`, 89 рядків) — доробити, не створювати.

**Slug.** `staff.ts:43` вигадує `b.id.toLowerCase()` — це UUID у нижньому регістрі. Замінити на поле з T-4413; поки T-4413 не здано — маппер має чекати його контракту, а не вигадувати значення. Невідомий slug → `notFound()`.

**Фото.** `staff.ts:47` жорстко `photoUrl: null` — фото з T-4610b ніколи не доїде. Читати поле, фолбек — `Avatar` з ініціалами (T-4507d), без «порожньої діри».

**Біографія.** `page.tsx:72` — один рядок на всіх барберів. Дані мають приходити з профілю; **відсутність біографії не заповнюється текстом-відмазкою** (краще порожній блок, ніж брехня в index'ованому тексті). Плюс досвід і спеціалізація, якщо є.

**Послуги з цінами** (`PRT-WEB-02`). Публічний каталог послуг локації; ціна — `ServicePrice` саме цієї локації. Клієнтські персональні знижки на публічній сторінці не показуються (ADR 0010). Без локації ціна невизначена — «запитайте», не вигадане число.

**SEO.** `title`/`description` з імені та локації, canonical, OG (патерн SRV-005), schema.org `Person` + `HairSalon` (патерн SRV-003) — валідація rich-results тестом. Без рейтингу: `booking-flow.md:114` забороняє його до публічних відгуків.

**Стани.** `empty`/`error`/`notFound` як на `barbers/page.tsx` (`ErrorState`, `EmptyState`, `ActionLink`), а не crash. Барбер без фото/біографії/послуг — валідна сторінка.

Блоки галереї (T-191) і відгуків (T-240) — заглушки з правильним станом, без мертвих посилань.

## Why

Сторінка барбера — головна SEO-сторінка локального пошуку, і зараз вона обіцяє те, чого none: універсальна біографія для всіх майстрів виглядає як шаблон і знижує довіру, `slug` з UUID не дає стабільного URL, фото не доїде навіть після T-4610b. Це найдешевша конверсія, яку зараз просто викидають.

## Sources

- `docs/acceptance-criteria/15-public-gallery.md` **PRT-WEB-02** (послуги барбера з цінами; галерея — T-191)
- `docs/acceptance-criteria/22-service-seo-pages.md` SRV-003/SRV-005 — патерн schema.org і метаданих (власник AC — T-250)
- `docs/booking-flow.md:114` — склад картки; рейтинг не показується
- `design-system.md` §Компоненти (Avatar, EmptyState); ADR 0010 (без клієнтських цін), ADR 0015 (персональні дані), ADR 0019 (LOC < 100)
- T-4413 (slug), T-4610b (`photoUrl`), T-4513 (стани), T-4507d (`Avatar`), T-191/T-240 (сусідні блоки)

## Implementation plan

Paths:
- apps/web/src/app/barbers/[slug]/BarberDetailContent.tsx
- apps/web/src/app/barbers/[slug]/BarberProfileFacts.tsx
- apps/web/src/app/barbers/[slug]/BarberSections.tsx
- apps/web/src/lib/api/staff.ts
- apps/web/src/app/barbers/__tests__/barber-detail.test.tsx
- apps/web/src/lib/api/__tests__/staff.test.ts

Checks:
- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/barbers/__tests__/barber-detail.test.tsx`
- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/lib/api/__tests__/staff.test.ts`

## Done

- [ ] `slug` із канонічного поля T-4413; `id.toLowerCase()` видалено; невідомий slug → `notFound()`
- [ ] `photoUrl` з публічних даних T-4610b; фолбек — `Avatar` з ініціалами
- [ ] Біографія/досвід/спеціалізація з даних; **регрес-тест «однакова біографія для всіх барберів неможлива»**
- [ ] Послуги барбера з цінами локації (PRT-WEB-02); без клієнтських знижок; без локації — «запитайте»
- [ ] SEO: `title`/`description`/canonical/OG + schema.org `Person`/`HairSalon`; rich-results тест
- [ ] Стани `empty`/`error`/`notFound`; сторінка працює без фото, біографії й послуг
- [ ] Заглушки галереї (T-191) і відгуків (T-240) без мертвих посилань
- [ ] Адаптив і a11y: `width`/`height` (без CLS), `alt`, контраст, фокус; файл ≤100 рядків (ADR 0019)
- [ ] Tests: повний профіл, мінімальний профіл, 404, SEO-розмітка
- [ ] `pnpm docs:validate` зелений

## Risks

- [ ] **Універсальна біографія** лишається, якщо «просто підставити текст» — прямий регрес довіри й SEO; краще порожній блок
- [ ] **Вигаданий slug** як тимчасове рішення не зникне разом із Т-4477 — зафіксувати залежність від T-4413, не маскувати
- [ ] **N+1** на публічній сторінці (фото + послуги + ціни) — агреговано, з кешем T-4513
- [ ] **Ціна без локації** вигадається «на око» — невизначена ціна показується як невизначена
- [ ] **Рейтинг «прилипає»** до картки (порушення `booking-flow.md:114`) — регрес-тест
- [ ] **Заглушка відгуків** виглядає як справжній блок — порожній стан має бути чесним («відгуків ще none»), а не нульовим рейтингом

## QA

- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/app/barbers/__tests__/barber-detail.test.tsx` exit 0
- `npx jest --config apps/web/jest.config.js --runTestsByPath apps/web/src/lib/api/__tests__/staff.test.ts` exit 0
