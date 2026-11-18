# T-4543 · Client self-service portal: appointments, loyalty, memberships, gift cards, payments

- **Stage**: M2 (phase 5-6) · **Tags**: frontend, backend, crm · **Complexity**: middle · **Depends on**: T-032, T-060, T-061, T-140, T-142, T-210, T-211, T-3901
- **StoryPoints**: 13

## What

Розширення web-кабінету (T-032) та mobile (T-072) до повноцінного self-service:
- **Appointments**: майбутні (з діями: перенести, скасувати, повторити, "записати з тим самим барбером/послугою"), минулі (історія з деталями, чеками, фото референсу)
- **Loyalty**: баланс балів/кешбеку, прогрес до безкоштовного візиту (T-140), історія нарахувань/списань
- **Memberships**: активні абонементи, залишок візитів, дата закінчення, історія використання (T-3901)
- **Gift cards**: баланс, історія погашення, можливість подарувати (передати) — T-211
- **Promotions**: доступні промокоди, автоматичні знижки (VIP, birthday)
- **Profile**: редагування імені, email, дати народження, комунікаційних преференцій (T-4218)
- **Payment history**: список оплат, чеки (PDF), статус депозитів/решт
- **Notifications preferences**: канали (push/SMS/email/Viber/Telegram), типи повідомлень (транзакційні/маркетингові)

## Why

Клієнт сам керує своими записами, бачить бонуси, абонементи — знімає навантаження з рецепції, підвищує LTV.

## Sources

- T-032 (web cabinet), T-072 (mobile client), T-140/142 (loyalty surfaces), T-210/211 (gift cards), T-3901 (memberships), T-4218 (comm prefs)
- Altegio: panel klienta — wizyty, lojalność, abonamenty, karty podarunkowe, historia płatności

## Done

- [ ] Web: `/account/appointments` (tabs: upcoming/past), `/account/loyalty`, `/account/memberships`, `/account/gift-cards`, `/account/payments`, `/account/settings`
- [ ] Mobile: аналогічні екрани в Expo (T-072), push-навігація
- [ ] API: BFF endpoints для кабінету (агрегація з scheduling, loyalty, gift-certificates, billing)
- [ ] Reschedule/Cancel/Repeat actions з валідацією політик (T-4542)
- [ ] PDF чеки: генерація через `billing` (T-092), скачування в кабінеті
- [ ] Accessibility: a11y (T-4510), responsive (T-4509)

## Risks

- [ ] **Дані з різних контекстів**: BFF потрібен щоб уникнути N+1 запитів з фронту
- [ ] **Права**: клієнт бачить ТІЛЬКИ свої дані (RLS в DB / policy в API)