# T-270 · Контекст `shop`: Product/Variant/Stock

- **Stage**: M5 (phase 27; каркас — v1.1) · **Tags**: backend · **Complexity**: middle · **Depends on**: T-020, T-002 (бакет media)
- **StoryPoints**: 5

## What

`shop` у моноліті (без нового сервісу — ADR 0002): Product (опис, бренд, категорія, фото в `media.fade.com.ua` — SHOP-003), ProductVariant (об'єм/колір, окремі ціна і сток), StockItem по локаціях; **не змішується з `catalog` послуг** (SHOP-002); вимкнений товар зникає негайно. Події `ShopReservation*`, `Order*` — у плані контексту.

## Sources

- `SHOP-002/003`; `docs/online-shop.md` (каталог і склад); ADR 0017 (media, CORS)

## Done

- [ ] Модель і адмін-CRUD працюють
- [ ] Фото в media-бакеті з CDN

## Risks

- [ ] **Межа магазину**: замовлення не рахуються у 7-й візит (SHOP-024)

