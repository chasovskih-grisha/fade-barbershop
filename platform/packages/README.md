# Packages

| Пакет | Навіщо |
|-------|--------|
| `contracts` | OpenAPI та інтеграційні події |
| `domain-shared` | Мінімальний shared kernel для клієнтів API |
| `design-tokens` | Машинні токени дизайн-системи: `tokens.json` → `dist/tokens.css`, `tokens.js`, `tailwind-preset.cjs`, `nativewind-theme.js` (T-004) |
| `ui` | React-компоненти web/admin дизайн-системи (T-004); споживачі — web + admin |

Не додавати нових спільних пакетів, доки не з’явиться другий споживач тих самих сутностей (KISS/YAGNI).
