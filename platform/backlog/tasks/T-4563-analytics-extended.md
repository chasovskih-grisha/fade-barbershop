# T-4563 · Analytics & reporting: marketing, loyalty, customer, barber dashboards, report builder

- **Stage**: M3-M4 (phase 14, 40) · **Tags**: backend, analytics · **Complexity**: senior · **Depends on**: T-110, T-111, T-3201, T-3202, T-3203, T-4545, T-4551, T-4553, T-4554
- **StoryPoints**: 21

## What

Розширення analytics (T-110/111/3201/3202/3203) до повноцінної BI-платформи:
- **Business dashboards**: revenue (by period/service/barber/source), avg check, visits, completed/cancelled/no-show, utilization, chair revenue/hour
- **Customer analytics**: new/returning, retention cohorts, churn prediction (RFM), LTV, visit frequency, acquisition source (T-4536), revenue by segment (T-4545)
- **Barber dashboards**: utilization, appointments, revenue, avg check, services mix, repeat clients, cancellation/no-show rate, commission, tips, client retention per barber
- **Marketing analytics**: acquisition source, campaign performance (T-3101/4557), conversion (booking funnel), referral performance (T-4554), promotion performance (T-4553), CAC, revenue by campaign
- **Loyalty analytics**: points issued/redeemed, cashback, membership sales/utilization, gift card sales/redemption, breakage, tier distribution
- **Report builder**: ad-hoc звіти — вибір метрик, вимірів, фільтрів, групувань, візуалізація (таблиця/лінійна/стовпчикова/кругова), збереження, розклад (email/telegram), експорт CSV/Excel
- **Role-based access**: founder (все), admin (операційні), barber (власні KPI), location_manager (локація)
- **Real-time vs batch**: KPI дашборд — real-time (read model projections), глибока аналітика — batch (щоденний ETL в OLAP/ClickHouse або materialized views)

## Why

Data-driven decisions: цінові політики, маркетинг, завантаження, утримання. Поточний T-110 — базовий KPI.

## Sources

- T-110/111 (analytics core), T-3201/3202/3203 (customer/barber/shop analytics), T-4545 (segmentation), T-4551 (loyalty), T-4553 (promotions), T-4554 (referrals)
- Altegio: raporty biznesowe, klienci, fryzjerze, marketing, lojalność, budowniczy raportów

## Done

- [ ] Read models: projections на подіях (scheduling, billing, loyalty, gift-certificates, referrals, inventory) → materialized views в Postgres або ClickHouse
- [ ] API: `GET /analytics/{dashboard}?metrics=&dimensions=&filters=&period=` з кешуванням
- [ ] Report Builder UI: drag&drop metrics/dimensions, filters, visualizations, save/share, schedule
- [ ] Pre-built dashboards: Business Overview, Customer Intelligence, Barber Performance, Marketing ROI, Loyalty Health
- [ ] Role-based data scoping: RLS policies в DB / policy в API
- [ ] Export: CSV/Excel/PDF для збережених звітів
- [ ] Real-time KPI: WebSocket оновлення дашборду (опціонально)

## Risks

- [ ] **Data volume**: події ростуть → архітектура: Postgres для operational analytics, ClickHouse/Snowflake для historical (M6)
- [ ] **PII in analytics**: анонімізація clientId в агрегованих звітах, доступ до row-level лише з правами