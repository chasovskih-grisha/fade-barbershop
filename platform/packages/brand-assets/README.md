# @fade/brand-assets

Збутковий артефакт бренд-киту FADE для платформи (T-4609a). **Джерело правди — `brand/logo/system/` поза цим репозиторієм** (AGENTS.md забороняє змішувати бізнес-документи з кодом), тому пакет оновлюється конвеєром, а не вручну.

## Правило

- `brand/` — masters; пакет — копія з `checksums.json`-маніфестом.
- Оновлення: `pnpm --filter @fade/brand-assets sync` (локально, коли `../company/brand/logo/system/` доступний) + візуальна перевірка `review.html` з source kit.
- CI: `pnpm --filter @fade/brand-assets verify` — рекомпілює sha256 `assets/` проти маніфесту; розходження → ненульовий exit. У CI джерела поруч немає, тому маніфест — єдина правда там.

## Файли (provenance: `brand/logo/system/`, роль — за README джерела)

| Файл | Роль |
|------|------|
| `lockup.svg` | Primary. FADE + BARBERSHOP, прозорий |
| `lockup-on-dark.svg` / `lockup-on-milk.svg` | Той самий lockup на ink/milk-полі |
| `mark-fa.svg` | Символ: додаток, favicon, штамп; ink на прозорому |
| `mark-fa-on-dark.svg` / `mark-fa-on-milk.svg` | Символ на полі (самодостатні — мають власне тло) |
| `favicon.svg` | Вектор для вкладки |
| `favicon-32.png` / `favicon-16.png` | Растр вкладки |
| `app-icon-1024.svg` | Іконка застосунку (square, unmasked) |

`app-icon-1024.png` (966 КБ) свідомо не копіюється: платформа v1 його не споживає, іконка мобільного — конфігурація Expo поза цим пакетом.

## Споживання

- Сайт: шапка і футер (`SiteHeader`/`SiteFooter`), посилання на логіні — `lockup-on-dark.svg` (нічний варіант, бо хром стоїть на night); фолбек логотипа локації — `mark-fa-on-dark.svg` (самодостатній знак, видимий на обох темах); вкладка — `favicon.svg`.
- Шлях імпорту: `@fade/brand-assets/assets/<file>` (статичний asset Next.js; svg не йде через `next/image`).

## Ключові зображення локацій

Логотипи локацій — **не** з цього пакета: вони завантажуються адміном у публічний бакет `location-brand` (порт `PublicMediaStorage`, T-4609a). Пакет — лише мережевий знак і фолбек.
