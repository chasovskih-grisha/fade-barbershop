# T-4463 · Відгук: повторна оцінка (закритий цикл)

- **Stage**: M4 (phase 8) · **Tags**: backend, feedback · **Complexity**: junior · **Depends on**: T-151, T-240
- **StoryPoints**: 3
- **Статус**: review

## What

Після надісланого відгуку низької оцінки — ланцюг: клиент може «покращити оцінку» (редагування), відповідь адміна (T-4451) активує повторне питання; стан «закрито» фіксується, у випадку 4-5★ — публічний демо-запис (T-240) з перевіркою (не згрублений текст).

## Why

Негатив відгуку без реакції втрачає лояльність; закритий цикл (ніби зворотного зв'язку роботодавцю) повертає довіру.

## Sources

- feedback README; FDB-* (AC); T-151 (відгуки), T-240 (демо), T-4451 (відповіді)

## Done

- [x] Повторна оцінка/редагування відгуку; стан «закрито»
- [x] Демо-запис на 4-5★ показується лише після перевірки (модерація)
- [x] Логіка «не питаємо двічі поспіль низьку» в тесті

## Реалізація

- `feedback-surfaces/review-revaluation.policy.ts` — чистий домен: `openRevaluation`,
  `applyClientRating`, `canEditRating`, `recordAdminReply`/`shouldAskForRevaluation`,
  `closeLoop`, `moderateShowcase`, `publicShowcaseEligibility`, `revaluationSummary`.
  Пороги: `LOW_RATING_MAX = 3`, `SHOWCASE_MIN_RATING = 4`,
  `SHOWCASE_MIN_TEXT_LENGTH = 20`.
- `feedback-surfaces/review-revaluation.service.ts` — `ReviewRevaluationService` +
  порт `ReviewRevaluationRepository` і in-memory реалізація (у
  `prisma/schema.prisma` досі немає моделей відгуків; Prisma-адаптер
  підключається без зміни use-case).
- `feedback-surfaces.controller.ts` — `POST client/reviews/:reviewId/revaluation`,
  `POST admin/reviews/:reviewId/revaluation/reply`, `…/close`, `…/showcase`,
  `GET admin/reviews/:reviewId/revaluation`, публічний `GET showcase`.
- `feedback-surfaces.module.ts` — провайдер і експорт сервісу/порту.
- `review-revaluation.spec.ts` — 16 тестів (політика, сервіс, HTTP-маршрути).

## Нотатки

- Публічна проєкція `GET showcase` віддає **лише** схвалені модерацією 4–5★
  записи з текстом ≥ 20 символів. Сторінка `/reviews` (T-240) досі `todo` —
  її підключення до цієї проєкції лишається за T-240; тут вітрина як контракт.
- Повторний запит оцінки надсилається максимум один раз на ту саму низьку
  оцінку; після покращення оцінки цикл може запитати фінальну оцінку ще раз.
- Стан циклу не durable (in-memory) до появи persistence-слайсу відгуків.

## Risks

- [x] **Фрод оцінок**: скидання на 5★ без реальної покупки — модерація оператором
  (`moderateShowcase` обов'язкова перед публікацією, повторна оцінка скидає
  схвалення в `pending`)
