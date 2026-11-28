# T-4541 · Online booking: deep links, shareable URL, embeddable widget

- **Stage**: M1 (phase 3-4) · **Tags**: frontend, marketing · **Complexity**: middle · **Depends on**: T-041, T-053, T-4532
- **StoryPoints**: 8

## What

Розширення quick-booking (T-053) та основного флоу (T-041) для маркетингових сценаріїв:
- **Deep links**: `fade.com.ua/booking?service={slug}&barber={slug}&date=YYYY-MM-DD&time=HH:MM` — презаповнення кроків 1-3
- **Shareable booking URL**: унікальне посилання на запис для відправки клієнту (QR, SMS, email) — веде в флоу з презаповненими даними
- **Embeddable booking widget**: `<iframe src="https://fade.com.ua/booking/widget?location=CLT-01&theme=light">` — мінімальний UI для вбудовування на сторонні сайти (лендінги, партнери)
- **Mobile-friendly**: responsive дизайн, PWA-ready (T-4509), touch-optimized слоти
- **UTM tracking**: автоматичне збереження utm_source/medium/campaign в `Appointment.sourceData` для аналітики

## Why

Маркетингові кампанії (Google Ads, Meta, email, QR в салоні) потребують прямих посилань на конкретну послугу/барбера/час. Віджет — для партнерських сайтів.

## Sources

- T-041 (booking flow), T-053 (quick booking), T-4532 (location-aware routes), T-260 (GBP integration)
- Altegio: link do rezerwacji, widget rezerwacji, deep linking

## Done

- [ ] URL схема з query params для всіх кроків флоу
- [ ] Widget mode: прихований header/footer, compact UI, `postMessage` для повідомлення батьківському вікну про успіх
- [ ] Генерація shareable URL в адмінці/барбер mobile (кнопка "Поділитися записом")
- [ ] UTM persistence: middleware що зберігає UTM в сесію/cookie і підставляє при створенні запису
- [ ] Tests: deep link відкриває потрібний сервіс/барбера/дату, widget працює в iframe

## Risks

- [ ] **Widget security**: CSP, sandbox атрибути, origin validation для postMessage
- [ ] **Slot race**: deep link до конкретного часу — слот може зайнятися до завершення флоу → валідація на кроці підтвердження