# T-4561 · Inventory & products: stock, SKU, barcode, consumables, write-offs, suppliers, profitability

- **Stage**: M5 (phase 27) · **Tags**: backend, frontend, retail, finance · **Complexity**: senior · **Dependencies**: T-270, T-3401, T-4214, T-4548, T-4549
- **StoryPoints**: 21

## What

Full inventory and store (shop-lite → full shop):
- **Products**: name, category, SKU, barcode, purchase price, retail price, VAT, unit of measure, description, photos
- **Stock management**: quantity in stock (by locations), min level, low-stock alerts (push/email to admin), automatic ordering (optional)
- **Stock movements**: receipt (supply), write-off (sale, service consumption, loss, transfer between locations), inventory (audit)
- **Stock adjustments**: manual correction with reason (loss, fire, client return) — audit (T-4216)
- **Consumables**: binding to services (T-4548 `consumableItems[]`) — automatic write-off on `AppointmentCompleted` (qty * norm)
- **Service consumables**: consumption norms per service (e.g. dye 30g, oxidant 60ml), norm versioning
- **Automatic write-off**: event handler `AppointmentCompleted` → for each service → write-off consumables → `StockMovement` type=CONSUMPTION
- **Supplier information**: suppliers, contacts, contracts, price lists, payment terms
- **Purchase orders**: creating order to supplier (manual or auto by min stock), receipt, delivery check
- **Inventory reports**: turnover, product margin, ABC analysis, dead stock, inventory value
- **Product profitability**: revenue - purchase - operating costs (barber commission for sale T-4549)

## Why

Material cost control, retail sales (shop), theft/loss prevention, P&L by products.

## Requirement sources

- T-270 (shop), T-3401 (consumables), T-4214 (dynamic pricing), T-4548 (services consumables), T-4549 (payments)
- Altegio: magazyn, SKU, kody kreskowe, zużycie materiałów, inventaryzacja, dostawcy, rentowność produktów

## Done

- [ ] Domain: `Product`, `StockLevel` (productId, locationId, quantity, reservedQuantity), `StockMovement` (type: RECEIPT/SALE/CONSUMPTION/WRITE_OFF/TRANSFER/ADJUSTMENT, quantity, reason, referenceId)
- [ ] Consumable norms: `ServiceConsumable` (serviceId, productId, quantity, unit)
- [ ] Auto write-off: `AppointmentCompleted` → loop ServiceConsumable → decrement StockLevel → create StockMovement
- [ ] Low-stock alert: scheduled job → if quantity < minLevel → notification (T-4555)
- [ ] Admin UI: Products CRUD, Stock dashboard (by locations), Movements log, Inventory audit (barcode scanning), Suppliers, Purchase Orders
- [ ] Shop integration: T-270 (shop-lite) — products from catalog, reserve "book to cash"
- [ ] Reports: profitability, turnover, ABC, dead stock

## Risks

- [ ] **Concurrency**: simultaneous write-off of one product — optimistic locking on StockLevel
- [ ] **Accounting**: FIFO/LIFO for written-off goods cost — clarify with accountant
- [ ] **Units**: different units (pcs, ml, g) — conversion to base unit on write-off
