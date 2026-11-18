# T-4545 · Reusable segmentation engine (P1)

- **Stage**: M4 (phase 8) · **Tags**: backend, crm, analytics, marketing · **Complexity**: senior · **Depends on**: T-4424, T-4461, T-3201, T-4544
- **StoryPoints**: 13

## What

Універсальний двигун сегментації, що замінює T-3000 (dangling) і консолідує:
- **Manual tags** (T-4424) — базові атрибути
- **Saved filters** (T-4461) — adhoc запити
- **RFM segments** (T-3201) — автоматичні когорти (Recency, Frequency, Monetary)
- **Campaign audiences** — сегменти для win-back (T-3101), birthday, referral, loyalty

**Segment definition**: комбінація умов (AND/OR) над атрибутами клієнта:
- Демографічні: вік, стать, дата реєстрації
- Поведінкові: днів з останнього візиту, частота, сума витрат, середній чек
- Статусні: loyalty tier, membership, gift card balance, no-show count
- tags: ручні + автоматичні (напр., "birthday_this_month")
- Атрибуція: канал залучення (T-4536), реферал (T-220)
- Композиція: сегмент у сегменті (reuse)

**Segment evaluation**: on-demand (real-time) або scheduled (щоденно оновлювати materialized view). Результат — список clientId для використання в:
- Push/SMS/email кампанії (T-080, T-3100, T-4431)
- Анілітика (T-3201)
- Адмінка: фільтр "Сегмент" в списку клієнтів

## Why

Маркетинг потребує повторно використовуваних, версійованих сегментів. Поточні tags/filters — ad-hoc, не версіонуються, не комбінуються.

## Sources

- T-4424 (tags), T-4461 (saved filters), T-3201 (customer analytics), T-3101 (campaigns), T-4100 (journeys)
- Canvas P1: "Reusable segmentation model — replace dangling T-3000 and consolidate manual tags, saved filters, RFM, and campaign audiences"
- Altegio: segmenty klientów, filtry, grupy celowe do kampanii

## Done

- [ ] Домен: `Segment` (name, definition: JSON logic, version, createdBy, isSystem), `SegmentMembership` (clientId, segmentId, evaluatedAt)
- [ ] Engine:-parser JSON logic (примітивні оператори: eq, ne, gt, lt, in, between, exists) + комбінатори and/or/not
- [ ] Scheduled job: щоденний перерахунок системних сегментів (NEW, RETURNING, VIP, INACTIVE, AT_RISK, BIRTHDAY_MONTH)
- [ ] API: `POST /segments/evaluate` (on-demand), `GET /segments/{id}/members` (paginated)
- [ ] Admin UI: Segment Builder (visual query builder), версіонування, preview розміру
- [ ] Integration: вибір сегмента в кампанії (T-3101), в аналітиці (T-3201), в пуш-розсилці (T-080)

## Risks

- [ ] **Перформанс**: real-time evaluation на великих базах — materialized views + індекси
- [ ] **Версіонування**: зміна визначення сегменту не повинна ламати історичні кампанії — immutable versions