# T-4544 · Client CRM: extended profile, tags, categories, merge, import/export, blacklist

- **Stage**: M2 (phase 5) · **Tags**: backend, frontend, crm · **Complexity**: middle · **Depends on**: T-060, T-061, T-4423, T-4424, T-4461
- **StoryPoints**: 13

## What

Розширення T-060 (ClientProfile) до повноцінного CRM:
- **Extended fields**: email, date of birth, registration date, last/next visit (комп'ютовані), total visits, total revenue, average check, favorite barber/services, visit frequency, no-show count, cancellation count, loyalty status, membership status, gift card balance, client balance (prepaid)
- **Tags & Categories**: T-4424 (manual tags) + системні категорії (NEW, RETURNING, VIP, INACTIVE, HIGH_VALUE, AT_RISK) — автоматичне оновлення по правилах
- **Internal notes**: приватні нотатки адміна/барбера (розділені від client-visible)
- **Communication history**: лог відправлених SMS/push/email/Viber/Telegram (T-4218)
- **Appointment history**: пов'язаний список (T-061)
- **Payment history**: пов'язаний список (billing)
- **Marketing/Communication consent**: GDPR-compliant чекбокси (T-4417, T-3601)
- **Actions**: Create/Edit/Archive (soft delete), Search (full-text по імені/телефону/email), Filter (по тегах, локації, статусу, даті візиту), Sort
- **Merge duplicate clients**: T-4423 (дублікати) — UI для пошуку потенційних дублікатів (фuzzy match по телефону/імені) та злиття з збереженням історії
- **Import/Export**: CSV/XLSX імпорт клієнтів з валідацією, дедуплікацією, звітом про помилки (T-4448); експорт фільтрованого списку
- **Bulk actions**: масове додавання тегу, зміна категорії, відправка кампанії (T-3101)
- **Blacklist/Restrictions**: блокування онлайн-букінгу, позначка "не обслуговувати", причина
- **Client audit history**: хто/коли змінив профіль (T-4216, T-4496)

## Why

Централізована база клієнта для маркетингу, утримання, сервісу. Merge дублікатів — критично після міграції/імпорту.

## Sources

- T-060 (CRM profiles), T-061 (visit history), T-4424 (tags), T-4461 (saved filters), T-4423 (merge duplicates), T-4448 (import/export), T-4417 (privacy center)
- Altegio: karta klienta, tagi, kategorie, historia wizyt, import/export, czarna lista, zgody RODO

## Done

- [ ] Prisma: розширення `ClientProfile` з новими полями, індекси для пошуку
- [ ] API: CRUD, search (full-text PostgreSQL `tsvector`), filters, bulk actions
- [ ] Адмінка: список клієнтів з колонками, фільтрами, збереженими фільтрами (T-4461), картка клієнта з вкладками (Profile, Visits, Payments, Notes, Tags, Consents, Audit)
- [ ] Merge UI: пошук дублікатів → перегляд порівняння → підтвердження злиття
- [ ] Import/Export: CSV шаблон, валідація рядків, транзакційність (all-or-nothing або partial з звітом)
- [ ] Blacklist: перевірка в booking use cases (T-041, T-053, T-046)

## Risks

- [ ] **PII дані**: email, DOB — шифрування at rest (T-3601), доступ лише з правами
- [ ] **Merge незворотний**: soft delete старих профілів, архівування зв'язків