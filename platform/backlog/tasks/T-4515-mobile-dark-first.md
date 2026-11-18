# T-4515 · Mobile: dark-first-тема (`userInterfaceStyle` + статусбар)

- **Stage**: M2 (phase 6) · **Tags**: frontend, design, mobile · **Complexity**: junior · **Depends on**: T-4509
- **StoryPoints**: 3

## What

Токени дизайн-системи — dark-first (фон темний), але `apps/mobile/app.json` стоїть `"userInterfaceStyle": "light"` — конфлікт, який видно у симуляторі: статусбар/фон ROOT світлі, поки тема NativeWind темна. Задача: привести `userInterfaceStyle` до dark (або консистентна явна політика), статусбар (dark-content/light-content) під колір фону токенів, splash-колір з токенів, перевірка у симуляторі iOS+Android.

## Why

Audit mobile-шару зафіксував розбіжність між токенами (night-first) і `userInterfaceStyle` — це «перший кадр» при запуску: нативний сплеш/статусбар б'є по очах, доки завантажиться RN. Виправляється в момент T-4509 (NativeWind-тема), щоб ф6-екрани стартували з консистентного екрана.

## Sources

- `apps/mobile/app.json` (userInterfaceStyle, splash)
- `packages/design-tokens` (dist/nativewind-theme.js — колір фону)
- `docs/design-system.md` §Токени (dark-first), §Архітектура (NativeWind mobile)

## Done

- [x] `userInterfaceStyle` консистентний з токенами; явна політика зафіксована у T-4509d README
- [x] Статусбар/splash під колір фону токенів
- [x] Перевірено iOS і Android симуляторами (три сценарії: cold start, background, rotate)