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

## Re-verified at d92ff74d

At `d92ff74d` there is no `shop` context: `apps/api/src/shop` does not exist and `prisma/schema.prisma`
has no `ShopProduct`/`ProductVariant`/`StockItem` model. The review commit `e9c2a38c` instead extended
`catalog` (`domain/product.ts`, `admin-products.controller.ts`, `prisma-product.repository.ts`), which
SHOP-002 explicitly forbids («не змішується з `catalog` послуг»). «Фото в media-бакеті з CDN» also has
no bucket in the repo. Unblocks when the `shop` context and its models are created as their own rows.
