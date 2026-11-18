# T-4571 · Search & filtering: full-text, filters, sorting, date ranges, saved filters, segments, bulk actions

- **Stage**: M4 (phase 16+) · **Tags**: backend, frontend, search · **Complexity**: middle · **Depends on**: T-4544, T-4545, T-4563, T-3801
- **StoryPoints**: 13

## What

Потужний пошук і фільтрація по всіх сутностях (розширення T-3801 search engine):
- **Entities**: Clients, Appointments, Barbers, Services, Products, Payments, Memberships, Gift Cards, Loyalty Transactions
- **Full-text search**: PostgreSQL `tsvector` + `tsquery` (ukrainian/russian/english config), rank, highlight, fuzzy (trigram `pg_trgm`)
- **Filters**: тип-безпечні фільтри по полях (enum, date range, numeric range, boolean, relation), composable (AND/OR/NOT)
- **Sorting**: по будь-якому полю (asc/desc), multi-sort
- **Date ranges**: preset (today, this week, this month, last 30 days, custom), relative (last N days)
- **Saved filters**: T-4461 розширено — збереження комплекту фільтрів + сортування + видимих колонок, іменоване, спільне (team) або особисте
- **Saved segments**: T-4545 — сегменти як збережені фільтри з версіонуванням, використання в пошуку
- **Bulk actions**: виділення (checkbox, shift-click, select all filtered) → масова дія:
  - Clients: add tag, change segment, export, send campaign, merge
  - Appointments: cancel, reschedule, change status, send notification, add note
  - Payments: refund, export, resend receipt
  - Products: adjust stock, change price, reorder
- **Search API**: `POST /search/{entity}` з DSL (JSON: query, filters[], sort[], page, size, highlight)
- **Admin UI**: Universal Search Bar (global cmd+K), Entity List Views з filter builder, saved filters sidebar, bulk toolbar

## Why

Швидке знаходження будь-чого, масова обробка, повторювані звіти/кампанії.

## Sources

- T-4544 (CRM), T-4545 (segmentation), T-4563 (analytics), T-3801 (search engine)
- Altegio: wyszukiwarka, filtry, sortowanie, zapisane filtry, segmenty, akcje masowe

## Done

- [ ] Search module: `SearchService` з DSL parser, Postgres full-text + trigram індекси
- [ ] Entity-specific search configs: searchable fields, filterable fields, sortable fields, highlight fields
- [ ] Saved filters/segments: CRUD, sharing (personal/team), versioning
- [ ] Bulk action framework: `BulkActionExecutor` (transactional, progress tracking, partial failure report)
- [ ] Admin UI: Filter Builder (visual), Search Bar (cmd+K), List View з колонками/сортуванням/виділенням
- [ ] Performance: індекси, materialized views для складних фільтрів, кешування популярних запитів

## Risks

- [ ] **PII в пошуку**: email/phone — лише для авторизованих ролей, маскування в результатах для не-адмінів
- [ ] **Bulk action safety**: подтверждение для небезпечних дій (cancel appointments, refund payments), audit log