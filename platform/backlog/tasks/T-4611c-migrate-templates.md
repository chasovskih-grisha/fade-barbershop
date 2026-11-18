# T-4611c · migration T-4608 і другий шаблон (3/11)

- **Stage**: M2 (phase 7) · **Tags**: backend, notifications · **Complexity**: junior · **Depends on**: T-4611b
- **StoryPoints**: 3
- **Пріоритет**: найвищий у смузі листа, після T-4611b. Ставить знак у лист підтвердження до прод-гейту T-4614.

## What

Доказ того, що примітиви — спільні, а не примітиви одного листа.

**(1) migration.** `booking-confirmation-template.ts` переводиться з рядкових стилів на `emailLayout`/`emailLogo`/`emailTable`/`emailText` (T-4611b) і `email.*` (T-4611a). Публічна поведінка не змінюється: `formatWhen` (Europe/Kyiv, ADR 0001), `confirmationLines`, екранування, контракт `EmailInput { text, html? }`. Повертається те саме ім'я функції, `send-booking-confirmation.spec.ts` зеленіє без зміни очікувань по суті.

**(2) Другий шаблон.** Чек візиту або рекомендація — на **тих самих** примітивах, без нових кольорів і layout-конструкцій. Його мета — виявити, що примітиви придатні для іншого листа: якщо для нього довелось Add `emailLayoutCheck`, це сигнал, що примітиви надто вузькі, і це треба Fix тут, а не на третьому листі.

**(3) README `notifications`.** Де живуть токени, де примітиви, які правила верстки, що належить T-4523 (тексти) і T-4555 (канали) — щоб наступна задача не вирішувала ті самі питання.

## Why

Без міграції перший лист лишається «приватним» і доводить примітиви напівголоса; без другого шаблона перевикористання — недоведене і через місяць з'явиться ще п'ять layout-варіантів.

## Sources

- `apps/api/src/notifications/application/booking-confirmation-template.ts` + `send-booking-confirmation.spec.ts` (поточні контракти й очікування)
- `apps/api/src/notifications/README.md` (межі контексту); `shared/email/ports.ts` (`EmailInput`)
- T-4608 (споживач, done), T-4611a/b (фундамент); T-4523/T-4555 — межі, не в цій задачі

## Done

- [ ] `booking-confirmation-template.ts` на примітивах; жодного хардкоду кольору/розміру (лінт-тест на `#[0-9a-f]{3,6}` і на `px` поза токенами)
- [ ] `formatWhen`, `confirmationLines`, екранування, ADR 0001 (Europe/Kyiv) — без змін поведінки; існуючі Tests зелені
- [ ] Логотип у шапці листа (з фолбеком); `alt` присутній
- [ ] Другий шаблон (чек або рекомендація) на тих самих примітивах; жодної нової layout-конструкції
- [ ] Обидва листи мають читабельний `text`-варіант
- [ ] Снапшоти HTML оновлені; тест на відсутність `<script>` і зовнішніх ресурсів
- [ ] `notifications/README.md` оновлено: токени, примітиви, правила, межі з T-4523/T-4555
- [ ] `pnpm docs:validate` зелений

## Implementation plan

Paths:
- apps/api/src/notifications/templates/
- apps/api/src/notifications/infrastructure/
- packages/design-tokens/

Checks:
- `pnpm --filter @fade/api exec jest src/notifications`

## Implementation notes

- apps/api/src/notifications/README.md
- apps/api/src/notifications/infrastructure/email-template-tokens.spec.ts
- apps/api/src/notifications/infrastructure/liquid-email-renderer.spec.ts
- apps/api/src/notifications/infrastructure/liquid-email-renderer.ts

## Risks

- [ ] **migration «змінила лист»** (відступи, порядок рядків) і зламала очікування клієнтів — регрес-тест на `confirmationLines` і швидка візуальна перевірка
- [ ] **Другий шаблон як окремий код** — тоді примітиви не справді спільні; рев'ю має відхилити таку реалізацію
- [ ] **Захоплення контенту**: не починати редагувати тексти «бо вже тут» — це T-4523
- [ ] **Другий шаблон нерозгорнутий** (не відправляється) — лишається мертвим кодом; або зелена публікація, або позначити як draft у README
- [ ] **Логотип додано в HTML, але не в `text`** — лист без зображень втрачає бренд (фолбек у text обов'язковий)
