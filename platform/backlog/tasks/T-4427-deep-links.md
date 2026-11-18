# T-4427 · Deep links / Universal Links

- **Stage**: M2 (phase 5) · **Tags**: mobile, integration · **Complexity**: middle · **Depends on**: T-070, T-071, T-053
- **StoryPoints**: 5

## What

Universal Links (iOS) / App Links (Android) на `fade.com.ua` (зокрема `/booking`): `fade://` схема для глибокого переходу в екрани (запис, послуга, локація, блок керування записом T-4418). Конфіг AASA/`assetlinks.json`, людино-readable fallback через веб-сторінку.

## Why

Посилання з SMS/вітрини повинні відкривати запис у додатку, а не кидати на «встановіть додаток»; без deep links все маркетплейс-трафік втрачає контекст.

## Sources

- client-screens.md; T-053 (публічний домен); products.md; T-4418 (посилання запису)

## Done

- [ ] `fade://` та Universal/App Links маршрутизуються в екрани
- [ ] Флоу з посилання запису відкриває потрібну дію без додаткових кроків
- [ ] Tests відкриття при вимкненому додатку (fallback)

## Risks

- [ ] **Відкриття посилання vs вхід**: глибокий перехід на приватний екран — редірект на вхід і повернення (стан збережено)