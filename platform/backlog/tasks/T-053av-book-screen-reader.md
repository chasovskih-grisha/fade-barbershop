# T-053av · Screen reader support book.fade.com.ua

- **Stage**: M1 (phase 4) · **Tags**: frontend, a11y · **Complexity**: junior · **Depends on**: T-053c, T-053e
- **StoryPoints**: 3

## What

Screen reader support для quick-booking:
- ARIA labels on all interactive elements
- ARIA live regions for dynamic content
- Focus management between steps
- Form field announcements
- Error message announcements
- Step progress announcements
- alt text on images

## Sources

- T-053e (accessibility compliance)
- T-4510 (a11y harness)
- WCAG 2.2 guidelines

## Done

- [x] ARIA labels присутні
- [x] Live regions працюють
- [x] Focus management працює
- [x] Form announcements працюють
- [x] Error announcements працюють
- [x] Step announcements працюють
- [x] alt text присутній
- [ ] NVDA/JAWS працюють коректно

## Верифікація (2026-11-10, статус лишається `review`; 7 з 8 пунктів тримаються)

Перевірено тестами (`booking-flow.a11y.test.tsx`, `booking-flow.error-focus.test.tsx`, `comment-step.test.tsx`; уся сюїта флоу — 25 тестів, пакет `apps/web` — 48 сюїтів / 180 тестів зелений) і живим прогоном у Chromium (Playwright; Next dev :13101 → стаб API :13100), 22/22 перевірок.

**Тримається**
- **ARIA на інтерактиві**: картки локацій/послуг/барберів — `role="button"` + `tabIndex={0}` + `aria-pressed` + Enter/Space; стрічка дат — `role="tablist"` з `aria-label` і `role="tab"`/`aria-selected`; `StepIndicator` — `<ol aria-label="Кроки запису">`; поле коментаря тепер має `<label htmlFor>` (не `placeholder`), тож усі інтерактивні елементи мають accessible name.
- **Live regions (виправлено 2026-11-10)**: `page.tsx` тримає `role="status"` + `aria-live="polite"` з «Крок N з 7: Назва» — у браузері прогнано всі сім переходів; це перший `aria-live` в `apps/web/src`.
- **Focus management (виправлено 2026-11-10)**: `useStepFocus(step, error)` переносить фокус у контейнер вмісту кроку (`tabIndex={-1}`), а на помилку — на `role="alert"`; перший рендер фокус не чіпає. У браузері: після кліку по локації `document.activeElement` = контейнер кроку, після 500 від POST — наш `p[role=alert]`.
- **Form announcements**: лічильник коментаря зв'язаний через `aria-describedby="booking-comment-counter"`, обмеження — `maxLength=500`; помилка сабміту не прив'язана до поля через `aria-invalid` свідомо — вона не про конкретне поле (єдине поле — необов'язковий коментар), тому живе як сторінковий `role="alert"`.
- **Error announcements / Step announcements**: окремо тримаються — `role="alert"` (assertive) на помилку і `role="status"` (polite) на крок; `aria-current="step"` + `sr-only` назви у `StepIndicator`.
- **alt text**: `steps/ReferenceThumbnail.tsx` — `alt="Референс зачіски"`.

**Не виконується**
- **NVDA/JAWS**: доказів none — ручних прогонів у репозиторії не зафіксовано, а в цьому середовищі скрін-рідера none. Chromium-прогін показує, що розмітка й фокус ведуть себе правильно, але не заміняє скрін-рідер: закривати пункт без прогону — самообман. Закриття — після NVDA/JAWS-прогону з фіксацією результату тут.

**Знайдено під час прогону (не борг флоу):** Next додає власний `#__next-route-announcer__` з `role="alert"`, тому в момент помилки в DOM два alert-регіони; тест і браузерна перевірка цілять саме в `p[role=alert]`. На зміні кроків (без навігації) анонсер мовчить і з нашим `role="status"` не конфліктує.

**Висновок:** 7 з 8 пунктів тримаються і доведені тестами + браузером. Лишається лише ручний прогін NVDA/JAWS — єдина причина, чому задача не закрита цим комітом.

## Risks

- [ ] **Browser compatibility**: різні screen readers поводяться по-різному
