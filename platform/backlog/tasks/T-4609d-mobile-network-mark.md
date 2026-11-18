# T-4609d · Мережевий знак у застосунку (3/14)

- **Stage**: M1 (phase 2) · **Tags**: frontend, design, branding · **Complexity**: junior · **Depends on**: T-4609a
- **StoryPoints**: 3
- **Пріоритет**: найвищий, паралельно з T-4609b і T-4609c, після `exports` у T-4609a.

## What

Клієнтський application показує той самий нічний знак, що сайт і адмінка. Нового малюнка none.

- Головна (`apps/mobile/src/app/index.tsx`) замість `<Text>Fade</Text>` показує `lockup-on-dark.svg`. Розмір заданий, `accessibilityLabel` = «FADE».
- `app.json`: відображувана назва — FADE. `icon`, `splash` і web-favicon вказують на справжні файли. Ідентифікатор пакета `com.barbershop.app` не чіпаємо — це обліковий запис магазину, не вивіска.
- Домашня іконка і splash — PNG. Expo не бере svg. Файл — `app-icon-1024.png` з `brand/logo/system/` (квадрат, без сквірклу; маску ставить система). Його додають у sync `packages/brand-assets` (зараз у пакеті лише svg) і кладуть у `apps/mobile/assets/`. Текстові заглушки `icon.png`, `splash.png`, `favicon.png` замінюються цим зображенням.
- Splash — той самий нічний знак на полі night, не окрема ілюстрація.

## Why

`app.json` називає application Barbershop і не має іконки. Файли в `assets/` — це коментарі з розширенням `.png`. Головна набирає «Fade» жирним текстом. Кіт уже містить `app-icon-1024.png` і нічний lockup; application їх не підключив.

## Sources

- T-4609 (полярність нічного хрому; png іконки — квадрат без маски)
- `brand/logo/system/README.md` §App icon
- `design-system.md` §Типографіка (шрифт не замінює знак)
- `apps/mobile/app.json`, `apps/mobile/src/app/index.tsx`, `apps/mobile/assets/`

## Done

- [x] `app-icon-1024.png` входить у sync `@fade/brand-assets` і збігається checksum із `brand/logo/system/`
- [x] `apps/mobile/assets/icon.png`, `splash.png`, `favicon.png` — растрові зображення знака, не текстові заглушки
- [x] `app.json` має назву FADE і посилання `icon` / `splash` / web favicon на ці файли; bundle id без змін
- [x] Головна показує `lockup-on-dark.svg`, не текстове «Fade»
- [x] Тест головного екрана: знак доступний за підписом «FADE», слова «Fade» як єдиного бренду none
- [x] `pnpm docs:validate` зелений

## Risks

- [ ] **Svg у полі `icon` Expo** магазин не прийме — домашня іконка лише png
- [ ] **Скруглення кутів у файлі** порушує правило kit (маску ставить Apple/Android). Файл лишається квадратним
- [ ] **Друга копія png повз checksum** розійдеться з `brand/`. Джерело в sync-маніфесті пакета
