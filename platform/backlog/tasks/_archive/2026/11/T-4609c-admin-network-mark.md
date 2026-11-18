# T-4609c · Мережевий знак в оболонці адмінки (3/14)

- **Stage**: M1 (phase 2) · **Tags**: frontend, design, branding · **Complexity**: junior · **Depends on**: T-4609a, T-4514
- **StoryPoints**: 3
- **Пріоритет**: найвищий, паралельно з T-4609b і T-4609d, після `exports` у T-4609a.

## What

Адмінка стоїть на тій самій night-поверхні, що й сайт. Знак береться з `@fade/brand-assets`, не з іконки `check` і не зі слова «Fade» шрифтом.

- Широкий сайдбар і екран логіну: `lockup-on-dark.svg`. Поруч лишається підпис «· Admin» шрифтом Fixel — це текст, не словознак.
- Вузький рейл (лише іконка): `mark-fa-on-dark.svg`.
- Вкладка: `favicon.svg`, ті самі байти, що на сайті. Заголовок вкладки називає FADE, не «Barbershop Admin».
- `BrandWordmark.tsx` більше не малює `Icon name="check"` і три прямокутники. Підпис для скринрідера лишається «Логотип Fade» на справжньому знаку.

Секція завантаження логотипа локації (T-4609a) не змінюється. Це знак мережі в хромі, не файл конкретної локації.

## Why

`BrandWordmark.tsx` підписує іконку галочки як логотип Fade. Логін (`login/page.tsx`) набирає «Fade · Admin» шрифтом display. `design-system.md` §Типографіка і `brand/logo/system/README.md` це забороняють. Пакет із нічним lockup уже лежить поруч і ніким не імпортується.

## Sources

- T-4609 (полярність: хром = `*-on-dark`, вкладка = `favicon.svg`)
- `design-system.md` §Типографіка, §Кольори (night — база)
- `admin-screens.md` (оболонка); T-4514 (спільна оболонка адмінки)
- `apps/admin/src/app/components/BrandWordmark.tsx`, `Sidebar.tsx`, `login/page.tsx`, `layout.tsx`

## Done

- [x] `@fade/admin` залежить від `@fade/brand-assets`
- [x] Широкий сайдбар і логін показують `lockup-on-dark.svg`; вузький рейл — `mark-fa-on-dark.svg`
- [x] Іконка `check` і саморобний svg із трьох прямокутників з хрому прибрані
- [x] Вкладка — `favicon.svg`; title називає FADE
- [x] Тест: сайдбар і логін не містять слово «Fade» як єдиний знак; є `img` (або еквівалент) нічного lockup з `alt`
- [x] `pnpm docs:validate` зелений

## Risks

- [ ] **Прозорий ink-файл на night** зникає — лише `*-on-dark`
- [ ] **«· Admin» знову стає саморобним знаком** — підпис лишається звичайним текстом поруч із lockup
- [ ] **Вузький рейл обрізає lockup** нижче 120 px — там mark, не lockup (`brand/logo/system/README.md`, мінімальний розмір)
