# T-6002 · Real-Time Multi-Location Inventory Stock Sync & Automated Supplier PO Generation

- **Stage**: M10 (phase 9) · **Tags**: backend, retail, integration, database · **Complexity**: senior · **Depends on**: T-105, T-4561, T-270
- **StoryPoints**: 13

## What

Implement real-time inventory tracking across multiple barbershop studio locations and online storefronts. Automatically calculate safety stock levels, consumption velocity of professional consumables, and generate automated Purchase Orders sent to suppliers when stock falls below reorder points. Support inter-location stock transfers with audit trails.

## Why

Stockouts on retail products cost direct ecommerce revenue, while running out of professional consumables disrupts barbers during live appointments.

## Acceptance Criteria

1. Inventory levels update instantly across POS, mobile apps, and online shop upon sale or consumption logging.
2. Automated PO generation triggers when SKU stock dips below location-specific safety threshold.
3. Inter-location transfer workflow records transfer dispatch, receipt verification, and shrinkage discrepancy logs.

## Blocking evidence

The inventory domain does not exist: there is no `apps/api/src/inventory` module, no stock table, no supplier record and no mail transport for purchase orders. Safety stock, consumption velocity and inter-location transfers all need that model before a single endpoint can be written, so the row stays un-claimed.
