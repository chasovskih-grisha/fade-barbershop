# T-053au · Form validation book.fade.com.ua

- **Stage**: M1 (phase 4) · **Tags**: frontend, ux · **Complexity**: junior · **Depends on**: T-053c
- **StoryPoints**: 3

## What

Form validation для quick-booking:
- Phone number format validation
- OTP code validation (6 digits)
- Real-time validation feedback
- Form submission blocking
- Validation error messages
- Field focus management
- Accessibility announcements

## Sources

- T-053c (5-step flow)
- T-053n (GDPR - privacy notices)
- form validation best practices
- a11y guidelines

## Done

- [x] Real-time feedback працює
- [x] Submission blocking працює
- [x] Error messages коректні
- [x] Focus management працює
- [x] A11y announcements працюють

## Поза флоу (знято з чекліста 2026-11-10)

- **Phone validation** і **OTP validation** — у флоу запису none ні телефону, ні OTP-кроку: запис анонімний, `bookingApi.ts` кличе лише `/booking/*`, тож валідувати тут нічого. Живе це в `/login`: `apps/web/src/app/login/phoneFormat.ts` (`+380 (XX) XXX-XX-XX`) і `@fade/ui` → `PhoneInput`/`OtpInput` (`OTP_LENGTH`, `aria-label` на кожну цифру). Додавати OTP-крок у флоу лише щоб закрити чекбокс — свідомо ні: це зламало б узгоджений анонімний запис (T-041) і додало б крок, якого none в booking-flow.md. Валідація цих полів належить задачі логіну, а не цій.

Значення в `<textarea>` тут одне — коментар ≤500 символів (REF-WEB-02): він обмежений `maxLength` і показує живий лічильник, тобто єдине поле флоу має і обмеження, і real-time фідбек.

## Верифікація (2026-11-10, закрито)

Перевірено тестами і живим прогоном у Chromium. `npx jest` у `apps/web` — **48 сюїтів / 180 тестів** зелені; з них флоу запису: `booking-flow.validation`, `booking-flow.a11y`, `booking-flow.error-focus`, `booking-flow.empty`, `comment-step` (25 тестів у `src/app/booking`).

**Тримається**
- **Submission blocking**: кнопка `Підтвердити запис` стає `disabled` і `aria-busy="true"` одразу після кліку й повертається в робочий стан у `finally` (`bookingActions.confirm`); подвійний клік не шле другий POST (`comment-step.test.tsx`, `booking-flow.validation.test.tsx`).
- **Error messages**: відмова сервера → «Не вдалося Create запис — спробуйте ще раз» у `role="alert"` на рівні сторінки (`page.tsx`) + подія `bookingAnalytics.failed`; у браузері перевірено на 500 від POST.
- **Real-time feedback**: лічильник `0/500` зв'язаний з полем через `aria-describedby`, `maxLength=500`; у браузері 15 введених символів → `15/500`.
- **Focus management**: `useStepFocus(step, error)` — на зміну кроку фокус іде в контейнер вмісту (`[data-testid="booking-step"]`, `tabIndex={-1}`), на появу помилки — на `role="alert"`; перший рендер фокус не чіпає (стрибок фокуса при завантаженні — антипатерн).
- **A11y announcements**: `role="status"` + `aria-live="polite"` оголошує «Крок N з 7: Назва» на кожному переході; помилка — assertive через `role="alert"`.

**Живий прогін (Chromium, Playwright; Next dev :13101 → стаб API :13100)** — 22/22 перевірок: анонси кроків 1–7, фокус на вмісті кожного кроку (і `body` на першому), фокус на `alert` після 500, підпис поля коментаря і лічильник, спінер і `aria-busy` під час POST, екран успіху, CTA порожніх станів. Помилок консолі none, крім очікуваного 404 стаба на `/telemetry/web-vitals` (маяк RUM у стабі не реалізований — не стосується флоу).

**Свідома межа:** NVDA/JAWS у цьому середовищі none — анонси доведені на рівні розмітки й AX-дерева (role/aria + фокус), а не прогоном скрін-рідера; ручний прогін зафіксований як відкритий пункт у T-053av.

## Risks

- [ ] **User frustration**: занадто жорстка валідація може дратувати
