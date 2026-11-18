# T-4509b · Форм-примітиви mobile (3/13)

- **Stage**: M2 (phase 6) · **Tags**: frontend, design, mobile · **Complexity**: middle · **Depends on**: T-4509a
- **StoryPoints**: 3

## What
Формовий шар мобільного кіту на NativeWind: Field (лейбл+інпут+хелпер+помилка), PhoneInput (маска +49), OtpInput (код з Identity), Sheet (бер-банк донизу для вибору, спільне з `@fade/ui` поведінкою), Skeleton-плейсхолдер форми. Стани: loading (Skeleton), error (інлайн), disabled. Усе з токенів.

## Why
Флоу запису (T-071) і логін OTP (оболонка T-070, див. `client-screens.md`) — це фо-кроки; без форм-примітивів кожен екран малює власний TextField+клавіатуру. Спільна реалізація = консистентні клавіатурні опції і стан помилки телефону/OTP.

## Sources
- `docs/client-screens.md` §0 (вхід OTP), §2–3 (запис: телефон)
- `docs/components/PhoneInput.md`, `OtpInput.md`, `Field.md` (web-версії як референс)
- `docs/ux-guidelines.md` §Стани, §Доступність (фокус)

## Done
- [x] Field/PhoneInput/OtpInput/Sheet на NativeWind-токенах, KeyboardOptions з раціоналу
- [x] Стан помилки телефону/OTP (inline) + Skeleton форми
- [x] Юніт-Tests і перевірка в симуляторі (клавіатура, autofocus)
