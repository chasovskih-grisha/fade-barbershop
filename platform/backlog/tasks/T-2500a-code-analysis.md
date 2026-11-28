# T-2500a · Аналіз коду і пошук смолів (8/40)

- **Stage**: M6 (phase 40) · **Tags**: backend, quality · **Complexity**: senior · **Depends on**: T-004
- **StoryPoints**: 8

## What
Проаналізувати весь кодебаз: static analysis, lint, typecheck, manual review. Виявити дублювання, довгі функції, порушення SOLID, відсутність інтерфейсів, магіє податків. Create список смолів з пріоритетами.

## Why
Аналіз — основа рефакторингу. Список смолів дозволяє планувати роботу. Виявлені проблеми — для фіксації.

## Sources
- `package.json` (lint, typecheck скрипти)
- `docs/engineering-principles.md`
- `docs/review-checklist.md`

## Done

- [x] Аналіз завершений — `docs/code-analysis-2026-11.md`
- [x] Список смолів створений (P1–P4, 13 пунктів)
- [x] Пріоритети розставлені (таблиця «Order of work handed to the slices»)