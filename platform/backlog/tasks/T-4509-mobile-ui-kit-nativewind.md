# T-4509 · Mobile UI-кіт на NativeWind

- **Stage**: M2 (phase 6) · **Tags**: frontend, design, mobile · **Complexity**: senior · **Depends on**: T-004, T-4506
- **StoryPoints**: 13

## What

Перевести `apps/mobile` з ручних `StyleSheet` + `tokens.js` на NativeWind-тему з тих самих токенів (`nativewind-theme.js` уже генерується пакетом `design-tokens`). Зібрати мобільний UI-кіт з токенів: Button, Card, Badge/StatusPill, Field/PhoneInput/OtpInput, Skeleton, EmptyState, Toast, Sheet, Tabs (таб-бар), SlotPicker, PriceBreakdown. Споживається екранами client (T-070–T-072) і barber (T-082–T-084).

## Why

`design-system.md` §Архітектура: mobile-компоненти живуть у `apps/mobile/ui` **на NativeWind з тих самих токенів**; phase 6 — офіційна точка перетворення (відзначено ще в T-004). Без кіту ф6-екрани дублюють стилі та hex, а тема NativeWind лишається мертвим артефактом.

## Sources

- `docs/design-system.md` §Архітектура (NativeWind-тема mobile), §Компоненти, §Токени
- `packages/design-tokens` (`nativewind-theme.js` у dist, verify-гейт)
- `docs/client-screens.md`, `docs/barber-screens.md` (компоненти флоу)
- `docs/ux-guidelines.md` (§Стани — loading/empty/error на мобільних екранах)

## Done

- [ ] `apps/mobile/ui` збирається з NativeWind-токенів (жодного hex у компонентах)
- [ ] Примітиви флоу (Button/Card/Field/PhoneInput/OtpInput/Sheet/Toast/SlotPicker/PriceBreakdown) готові
- [ ] T-070 (оболонка клієнта) використовує кіт, канонічний таб-бар
- [ ] Перевірено у симуляторі iOS/Android, юніт-Tests на примітиви

## Audit 2026-11-24

Reopened. Neither `apps/mobile/package.json` nor `pnpm-lock.yaml` contains
NativeWind; there is no Tailwind/NativeWind config or theme import. The mobile UI
still uses `StyleSheet`/`tokens.js`, and screens contain raw hex values. The archived
slices a–d do not describe the code that is actually in the tree. The parent cannot
be `done` until the NativeWind runtime exists and the kit/screens are migrated and
verified on both simulators.

## Risks

- [ ] NativeWind-версія не покриває всі RN-примітиви — свідомо лишаємо огородження (Serene), повна migration NativeWind — phase 6 без відкатів
- [ ] Таб-бар тягне вантаж — тільки нативна навігація Expo, без web-дубля

## Розбивка (слайси, 13 SP)

1. **T-4509a · NativeWind-перемикання + базові токен-примітиви** *(senior, 5 SP)* — тема/адаптація, Button/Card/Badge/Skeleton/EmptyState, нуль hex.
2. **T-4509b · Форм-примітиви mobile** *(middle, 3 SP)* — Field/PhoneInput/OtpInput/Sheet, KeyboardOptions, стан помилки.
3. **T-4509c · Флоу-примітиви** *(middle, 3 SP)* — SlotPicker/PriceBreakdown/StatusPill/StepIndicator/Tabs, empty-стан «none слотів».
4. **T-4509d · Спільний шар + вітрина-перевірка** *(junior, 2 SP)* — `apps/mobile/ui/`, компонентні README, перевірка iOS/Android.