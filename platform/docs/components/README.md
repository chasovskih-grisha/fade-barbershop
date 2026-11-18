# Компоненти `@fade/ui`

Сторінки-документи компонентів дизайн-системи (реалізація — `packages/ui`, задача T-004).
Для кожної сторінки: призначення, API, обов'язкові стани, приклад, do/don't.

Інструмент документування — рішення T-004: **Markdown-сторінки** (без Storybook).
Посилання в `design-system.md` §Governance.

## Primitives

| Компонент | Призначення |
|-----------|-------------|
| [Button](Button.md) | Головні дії: primary/secondary/ghost/destructive |
| [Field](Field.md) | Обгортка поля: label + help + error |
| [TextField](TextField.md) | Текстове поле з `Field`-обгорткою |
| [PhoneInput](PhoneInput.md) | Телефон з маскою +38 → E.164 |
| [OtpInput](OtpInput.md) | 6 цифр коду з SMS |
| [Checkbox](Checkbox.md) | Чекбокс з label/description/error; consent-варіант |
| [Badge](Badge.md) | Короткий маркер (tone), AI-бейдж |
| [Card](Card.md) | Контейнер `radius-card`, стан `interactive` |
| [Skeleton](Skeleton.md) | Скелетон локальної зони |
| [Tabs](Tabs.md) | Вкладки (role=tablist, клавіатура) |
| [Table](Table.md) | `Table` + `THead`/`TBody`/`TR`/`TH`/`TD` для admin-списків |
| [Toast](Toast.md) | `Toast` + `ToastViewport`, tone + автозакриття |
| [Modal](Modal.md) | Модальне вікно (центр, `Dialog`) |
| [Sheet](Sheet.md) | Бокова панель знизу (мобільні сценарії) |

## Patterns

| Компонент | Призначення |
|-----------|-------------|
| [StatusPill](StatusPill.md) | Статус візиту (тон з `tokens.json`) |
| [PriceBreakdown](PriceBreakdown.md) | Єдиний спосіб показу ціни: послуга → знижки → разом |
| [SlotPicker](SlotPicker.md) | Вибір слота: вільний/зайнятий/hold, «Будь-який барбер» |
| [StepIndicator](StepIndicator.md) | Кроки флоу (сегменти-лінії 16×3) |
| [ProgressBar](ProgressBar.md) | Лояльність X/7 (сегменти-капсули, Bone-інверсія 7-го) |
| [RatingStars](RatingStars.md) | Оцінка 1–5, read-only / інтерактивний |
| [PhotoUpload](PhotoUpload.md) | Завантаження фото + consent-чекбокс |
| [GalleryTile](GalleryTile.md) | Пара before/after 2×1, AI-бейдж |
| [ChatBubble](ChatBubble.md) | Повідомлення чату client/staff/system |
| [CalendarDay](CalendarDay.md) | День календаря `CalendarDay` + тиждень `CalendarWeek` |
| [EmptyState](EmptyState.md) | Пустий стан з наступною дією |

## Утиліти

- `cn(...classes)` — злиття/зарезолв класів для variant-API (`cn.md`).
- `formatMoney(amount)` — формат ₴ (тисячі — нерозривний пробіл).
- **Phone-хелпери** (`phone.md`): `phoneDigits`, `nationalDigits`, `toE164`, `formatPhoneInput`.
- `messageIds(id, help, error)` — генерація `aria-describedby`-посилань.