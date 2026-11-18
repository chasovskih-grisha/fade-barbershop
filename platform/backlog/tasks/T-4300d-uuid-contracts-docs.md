# T-4300d · API-контракти і Documentation UUID (4/30)

- **Stage**: M0 (phase 0) · **Tags**: backend, frontend · **Complexity**: junior · **Depends on**: T-4300b
- **StoryPoints**: 4

## What

Update `packages/contracts`: усі ID — `string` (UUID), без числових типів. Update zod-схеми валідації (regex UUID v7 у необов'язковому порядку — приймати v4 у dev-фіксчерах). Приклади в README контекстів. Прогнати web/admin на нових контрактах.

## Why

Контракти — єдине місце, де споживачі (web/admin/mobile) бачать ID. Пропуск тут = приховані `number`-типи в UI, які вибухнуть на проді.

## Sources

- ADR 0021; `packages/contracts/identity.ts` (еталон T-010)

## Done

- [x] Усі контракти типізовані `string`-ID; zod-валідація UUID
- [x] Web/admin компілюються на оновлених контрактах; Tests зелені
- [x] README контекстів містять приклади UUID-ідентифікаторів
