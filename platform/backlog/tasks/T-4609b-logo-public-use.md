# T-4609b · Публічне використання логотипа на сайті (3/14)

- **Stage**: M1 (phase 2) · **Tags**: frontend, design, branding · **Complexity**: junior · **Depends on**: T-4609a, T-4508
- **StoryPoints**: 3
- **Пріоритет**: найвищий, паралельно з T-4609c і T-4609d, після `exports` у T-4609a.

## What

Доведення знака до публічного сайту. Дані локації й завантаження — у T-4609a. Адмінка — T-4609c, application — T-4609d, лист — T-4611.

Сайт темний (`surface.base` = night). Хром бере `lockup-on-dark.svg` з `@fade/brand-assets`, не прозорий `lockup.svg` (ink на прозорому на night зникає) і не слово «Fade» шрифтом Fixel. Точки: `SiteHeader.tsx`, `SiteFooter.tsx`, посилання на логіні (`login/page.tsx`). Висота фіксована, `alt` = «FADE». Вкладка — `favicon.svg` (файл Next `app/icon.svg` з тих самих байтів, без нового малюнка). `packages/brand-assets/README.md` зараз пише, ніби шапка вже споживає lockup — це виправляється разом із підключенням.

`GET /locations` і `GET /locations/{code}` уже віддають `logo`. Веб-тип `Location` його не має. Споживачі: картка `/locations`, hero `/locations/{code}`, `Schema.org` (`logo` мережі, `image` локації). Вкладка локації не підміняється логотипом локації.

**Фолбек один.** Локація без логотипа показує `mark-fa-on-dark.svg`. Не копія `if (!logo)` у кожній точці. `alt` з моделі. Логотип не `aria-hidden`. Темна тема бере `darkUrl`, інакше світлий файл локації, інакше нічний мережевий знак.

## Why

Логотип локації зараз видно лише в адмінці. Шапка, футер і логін показують слово «Fade» шрифтом (`SiteHeader.tsx`, `SiteFooter.tsx`, `login/page.tsx`), хоча `design-system.md` §Типографіка це забороняє. Лист без знака лишається в T-4611.

## Sources

- `design-system.md` §Типографіка (правило пари: тільки кастомний lockup, шрифт не замінює лого), §Кольори
- `web-screens.md` §0/§1/§2 (герой, картка, деталі) · `admin-screens.md` §1.2
- T-4609a (модель і конвеєр), T-4508 (web-shell, done), T-4513 (кеш/вимкнені локації), T-4413 (slug-и у public-моделях)
- ADR 0005 (кеш public GET), ADR 0019 (LOC < 100)

## Done

- [x] `logo` у `GET /locations` і `GET /locations/{code}` (поле присутнє; порожньо, коли логотипа none)
- [x] `@fade/web` залежить від `@fade/brand-assets`; шапка, футер і логін показують `lockup-on-dark.svg`, не слово «Fade»
- [x] Вкладка — `favicon.svg`; сторінка локації її не підміняє
- [x] Картка `/locations`, hero `/locations/{code}`, `Schema.org` споживають `logo`
- [x] Фолбек на `mark-fa-on-dark.svg` в один спосіб, не копіями `if (!logo)`
- [x] Темна тема бере `darkUrl`, інакше `lightUrl`, інакше нічний мережевий знак; `alt` з моделі
- [x] Тест на локацію без логотипа, на `alt`, на нічний фолбек; шапка не рендерить слово «Fade» як знак
- [x] Логотип не ламає LCP і CLS: заданий `width`/`height` (або `aspect-ratio`)
- [x] README пакета описує фактичне споживання, а не шапку, якої ще none
- [x] `pnpm docs:validate` зелений

## Risks

- [ ] **Фолбек продубльовано** в картці, hero і Schema.org — лікується одним компонентом `LocationLogo`
- [ ] **Пустий `alt`** знецінює скринрідер: логотип локації несе зміст, не прикраса
- [ ] **Зсув макета** (CLS) через логотип без розмірів — на картках локацій їх буде багато
- [ ] **Прозорий ink-lockup на night**: `lockup.svg` у шапці зникає. Хром сайту — лише `lockup-on-dark.svg` / `mark-fa-on-dark.svg`
- [ ] **Кеш**: якщо публічні GET кешуються (ADR 0005), заміна логотипа має інварідувати кеш — Verify, що інвалідація реально відбувається
