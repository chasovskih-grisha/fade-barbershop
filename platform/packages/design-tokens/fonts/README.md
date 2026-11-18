# Шрифти Fixel (мінімальний набір T-004)

Підмножина офіційного набору Fixel (MacPaw × AlfaBravo), **free for commercial use**.
Джерело: `brand/fade_01_kit/fonts/` (повні 18 файлів + ttf/variable).

## Набір (web/admin, woff2)

- **Fixel Display** 600 / 700 / 800 — заголовки, ціни, hero.
- **Fixel Text** 400 / 500 / 600 — UI, форми, таблиці.

## Підключення

`import '@fade/design-tokens/fonts'` у кореневому layout (`apps/{web,admin}`).
`@font-face` генерується `build.mjs` з сімейств у `tokens.json` → `dist/fonts.css` +
файли копіюються в `dist/fonts/`. `font-display: swap` завжди.

## Решта ваг / мобільні

Повний набір і TTF для `expo-font` (mobile) — з `brand/fade_01_kit/fonts/`
(мінімум для mobile v1: Display-SemiBold + Text-Regular/Medium), підключення на фазі 6.

## Гейт

`pnpm --filter @fade/design-tokens verify` перевіряє `dist/fonts.css` і наявність
усіх файлів `dist/fonts/` (частина CI).