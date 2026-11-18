# @fade/ui

React-компоненти web/admin дизайн-системи платформи. Специфікація —
`development/platform/docs/design-system.md`; задача — **T-004** (M0).

## Принцип

Компоненти **виведені з реальних екранів**, а не «бібліотека заради бібліотеки»
(KISS/YAGNI). Стилі — тільки з токенів: Tailwind-утиліти з
`@fade/design-tokens/tailwind-preset.cjs` або CSS-змінні. hex/px у коді заборонені —
гейт ESLint у CI.

## Склад (росте за T-004)

Реалізовано (перші primitives + patterns, ковередж 100%):

- `Button` — variant `primary | secondary | ghost | destructive`, розміри `md | lg`,
  стан `loading` (`aria-busy`), `focus-visible` ринг.
- `Field`, `TextField` — label/help/error, `aria-describedby`/`aria-invalid`, `role="alert"`.
- `PhoneInput` (+38 маска, зберігання E.164; хелпери `toE164`, `formatPhoneInput`) — `/login`,
  реєстрація/профіль.
- `OtpInput` (6 цифр, авто-перехід, backspace, вставка з буфера, `onComplete`) — `/login`.
- `Checkbox` (label/description/error; consent-варіант для AI, відгуків, галереї).
- `Badge` (tone neutral/accent/success/warning/danger/info; AI-бейдж через `accent`).
- `Card` (поверхня `radius-card`, стан `interactive`).
- `Skeleton` (variant text/circle/rect, `aria-hidden`).
- `Tabs` (role=tablist/tab/tabpanel, стрілки/Home/End, пропуск `disabled`).
- `Table` + `THead`/`TBody`/`TR`/`TH`/`TD` (admin-списки).
- `Toast` + `ToastViewport` (tone info/success/warning/danger, `role=status|alert`, автозакриття).
- `Modal`, `Sheet` — через внутрішній `Dialog`: portal, focus-trap (Tab/Shift+Tab), Escape,
  клік по фону, блокування скролу body, `role=dialog`/`aria-modal`, повернення фокуса.
- `StatusPill` — тон із `visitStatus` у `tokens.json`, 7 статусів візиту.
- `PriceBreakdown` (+ `formatMoney`) — послуга, рядки знижок, фінальний рядок ₴.
- Утиліта `cn` — злиття класів для variant-API.

Рівень 2 (patterns) — повністю:

- `SlotPicker` — стани слотів `free | busy | hold`, вибір, «Будь-який барбер».
- `StepIndicator` — сегменти 16×3, `done`/`current`/`майбутній`, `aria-current`.
- `ProgressBar` — сегменти-капсули лояльності `X/7`, 7-й — Bone-інверсія.
- `RatingStars` — read-only (`role=img`) та інтерактивний (`radiogroup`).
- `PhotoUpload` — превʼю, `input[type=file]`, consent-чекбокс, помилка, `disabled`.
- `GalleryTile` — пара before/after 2×1, AI-бейдж, підпис.
- `ChatBubble` — `client | staff | system`, час, вирівнювання.
- `CalendarDay`, `CalendarWeek` — admin-сітка тижня, візити зі `StatusPill`, `isToday`.
- `EmptyState` — заголовок, опис, дія.

Mobile-компоненти живуть в `apps/mobile/ui` (NativeWind), не тут.

## Гейти

- Кожен компонент — з повним набором станів (`default…skeleton`, `error`) і doc-сторінкою.
- `hex` у `.tsx` = червоний білд (root `.eslintrc.js`, оверрайд для `packages/ui/src`).
- LOC < 100 на файл (ADR 0019).
