# T-4558 · Feedback & reviews: NPS, Google review request, escalation, analytics

- **Stage**: M4 (phase 12-25) · **Tags**: backend, crm, marketing · **Complexity**: middle · **Depends on**: T-150, T-151, T-260, T-4555, T-4545
- **StoryPoints**: 8

## What

Розширення feedback (T-150/151) до повноцінної системи відгуків:
- **Post-visit feedback request**: автоматична через X хвилин/годин після `AppointmentCompleted` (T-4557 journey), посилання на форму
- **Feedback form**: рейтинг (1-5 або NPS 0-10), текстовий відгук, фото (опціонально), приватний/публічний вибір
- **NPS**: розрахунок NPS (Promoters/Passives/Detractors), трекінг по барберах/локаціях/періодах
- **Internal feedback**: лише для адміна/барбера (не публікується), категорія (service, atmosphere, price, other)
- **Negative feedback escalation**: якщо рейтинг ≤ 2 → автоматичне Task адміну/засновнику (T-4505), тег клієнта "at_risk"
- **Positive feedback → review request**: якщо рейтинг ≥ 4 і клієнт погодився → пуш/email з проханням відгуку в Google (T-260 GBP integration)
- **Google review request**: deep link до GBP leave review, трекінг кліків/конверсії
- **Admin moderation**: список відгуків, фільтри, публікація/відхилення (для публічних), відповідь засновника
- **Public reviews display**: на сайті (T-151 phase 25) — schema.org Review/AggregateRating, фільтр по барберу/локації
- **Feedback analytics**: середній рейтинг, NPS trend, розподіл по категоріях, топ-проблеми, вплив на retention

## Why

Зворотний зв'язок = покращення сервісу + соціальний доказ (Google reviews) + утримання (ескалація негативу).

## Sources

- T-150/151 (feedback), T-260 (GBP integration), T-4555 (communications), T-4545 (segmentation), T-4557 (journeys)
- Altegio: ankiety po wizycie, NPS, eskalacja negatywnych, prośba o opinię w Google, analityka

## Done

- [ ] Domain: `Feedback` (clientId, appointmentId, rating, npsScore, text, photos[], isPublic, status: PRIVATE/PENDING_REVIEW/PUBLISHED/REJECTED, escalated: boolean)
- [ ] Journey: "Post-visit feedback" (trigger: AppointmentCompleted + delay 2h → send form)
- [ ] NPS calculation: scheduled job, materialized view по барберу/локації/місяцю
- [ ] Escalation: event handler на rating ≤ 2 → create AdminTask + tag client
- [ ] Google review flow: клієнт натискає "Залишити відгук в Google" → redirect до GBP з `place_id` (T-260)
- [ ] Admin UI: Feedback dashboard, moderation queue, responses
- [ ] Public site: `/reviews` + widgets на сторінках барберів/локацій (T-151)
- [ ] Analytics: NPS dashboard в T-110/3201

## Risks

- [ ] **Google ToS**: не гейтувати публікацію власного відгуку залежно від Google review (заборонено політикою)
- [ ] **Spam**: rate limiting на feedback forms, honeypot