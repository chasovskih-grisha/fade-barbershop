# @fade/design-tokens

Єдине джерело значень дизайн-системи Barbershop для всіх поверхонь. Специфікація —
`development/platform/docs/design-system.md`; цей пакет — її машинна реалізація (задача T-004, M0).

## Принцип

**tokens.json → генерація → споживання.** Значення живуть у `tokens.json` один раз.
Екрани ніколи не містять hex/px — тільки змінні звідси. Гейт «тільки токени» у CI
(stylelint/ESLint) перевіряє саме це.

```
tokens.json
  ├─ pnpm build → dist/tokens.css              (CSS-змінні: apps/web, apps/admin)
  ├─ pnpm build → dist/tokens.js               (JS-експорт: мапа StatusPill)
  ├─ pnpm build → dist/tailwind-preset.cjs     (Tailwind preset: apps/web, apps/admin)
  ├─ pnpm build → dist/nativewind-theme.js     (NativeWind theme: apps/mobile, фаза 6)
  └─ pnpm build → dist/fonts.css + dist/fonts/ (Fixel @font-face, woff2: apps/web, apps/admin)
```

## Споживання

**web/admin** (Tailwind preset + глобальні CSS-змінні):

```js
// tailwind.config.js
module.exports = {
  presets: [require('@fade/design-tokens/tailwind-preset.cjs')],
  content: ['./src/**/*.{ts,tsx}'],
};
```

```css
@import "@fade/design-tokens/css";
/* далі екран використовує тільки токени: */
.card { background: var(--color-surface-raised); border: 1px solid var(--color-border-default); border-radius: var(--radius-card); }
```

Утиліти Tailwind (мапа з токенів): `bg-surface-base` · `bg-surface-raised` · `text-fg` ·
`text-fg-secondary` · `text-fg-muted` · `border-line` · `border-line-strong` · `bg-accent` /
`text-accent-fg` (інверсна CTA) · `text-accent-blue` (тільки AI/focus) · `bg-interactive` /
`hover:bg-interactive-hover` · `text-semantic-success` · `rounded-input|card|pill|micro` ·
`font-display|text` · `text-body|h1|display…`.

**mobile** (NativeWind тема — підключається у фазі 6):

```js
// tailwind.config.js (mobile)
module.exports = { presets: [require('@fade/design-tokens/tailwind-preset.cjs')] };
// або ESM-тема: import theme from '@fade/design-tokens/nativewind-theme';
```

**Шрифти** (web/admin): `import '@fade/design-tokens/fonts'` у кореневому layout —
генерує `@font-face` для Fixel Display 600/700/800 + Fixel Text 400/500/600
(`font-display: swap`; woff2 бандляться Next). Повний набір і TTF для mobile
(`expo-font`) — `brand/fade_01_kit/fonts/`, підключення на фазі 6.

**StatusPill** (всі поверхні) бере тон із мапи `visitStatusTone` — семантика статусів
зафіксована один раз (`booked→neutral, confirmed→info, in_progress→accent, completed→success,
cancelled→muted, no_show→danger, waitlist_hold→warning`).

**Email-шар** (`email.*`, T-4611a): листи — світла тема `Paper`/`Ink` (`design-system.md`
§Кольори), не темні поверхні сайту. Нарізка похідна від `color.lightTheme.paper/ink`:
`email.bg`, `email.surface`, `email.text.primary`/`secondary`, `email.border`,
`email.accent.solid`/`onSolid`, `email.radius`, `email.spacing`, `email.fontStack`,
`email.fontSize.body`/`caption`. У `tokens.css` вкладені ключі стають змінними з дефісом
(`--email-text-primary`, `--email-accent-onSolid`, `--email-fontSize-body`, `--email-fontStack`…).
Контраст пар email перевіряє `pnpm contrast` (текст ≥ 4.5:1, межі ≥ 3:1) разом з рештою.

**Правило шрифтів у листах.** Fixel Display/Text у листах **не** використовуються: Gmail
вирізає webfont і зовнішні `<style>`, Outlook не підтримує `@font-face`. Листи беруть
системний стек із `email.fontStack`, а не рядок у шаблоні. Гейт `pnpm email:check` падає,
якщо `Fixel` з'являється у `font-family` будь-якого листа (`apps/api/src/notifications`).

## Правила

1. **Не редагувати `dist/`** — тільки `tokens.json` + `pnpm build`. `pnpm verify` падає, якщо
   згенероване розійшлося з джерелом (гейт CI).
2. **Зміна значення = зміна в обох місцях синхронно**: tokens.json і `design-system.md`
   (governance: зміни токенів — як ADR).
3. Іменування змінних: `--color-<група>-<ключ>`, `--radius-<ключ>`, `--space-N`,
   `--font-<ключ>`, `--font-size-<ключ>`.
4. Radіусна шкала (ревізія 2026-09-21): `radius-input 8` · `radius-card 12` · `radius-pill 999`
   · `radius-micro 4` (лише мікроелементи всередині карток). Дрібні елементи беруть
   `radius-input`, не заводять свою величину.

## Статус

- Кольори, радіуси, spacing, типографіка, мапа статусів — зафіксовані з design-system.md.
- `accent.blue #5C7CFA` — попередній: фінальний тон після контраст-тесту T-004 (гейт WCAG AA ≥ 4.5:1).
- Шрифти Fixel Display + Fixel Text — дефолт 2026-09-19, очікує підтвердження засновника;
  **реалізація підключена**: мінімальний набір woff2 у `packages/design-tokens/fonts`,
  `dist/fonts.css` генерується з токенів, apps/web|admin вантажать `@fade/design-tokens/fonts`.
- Згенеровано: `tokens.css`, `tokens.js`, `tailwind-preset.cjs` (web/admin), `nativewind-theme.js` (mobile), `fonts.css` + `fonts/`.
- Analytics taxonomy & design system integration (T-4576): design tokens and status/semantic color mappings for telemetry states.
