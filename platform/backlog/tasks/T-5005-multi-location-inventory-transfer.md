# T-5005 · Multi-Location Inventory Transfer & Automated Reordering Supply Chain

- **Stage**: M10 (phase 9) · **Tags**: backend, inventory, network, supply-chain · **Complexity**: senior · **Depends on**: T-4561, T-106, T-302
- **StoryPoints**: 8

## What

- Implement inter-location stock transfer workflows (request, dispatch, transit tracking, receiving verification) for retail hair products and professional salon supplies.
- Build automated low-stock reordering triggers based on sales velocity and lead times across the network.
- Add barcode scanning support on mobile/tablet for inventory stocktaking and audit reconciliation.
- Provide central warehouse and multi-location inventory dashboard reporting inventory turnover and shrinkage.

## Why

As the barbershop network expands (M10), inventory needs to be fluidly balanced between locations to prevent stockouts on popular retail products and minimize dead stock tied up in slow-moving branches.

## Sources

- `platform/docs/products.md`, `platform/network/unit-economics.md`, T-4561, T-106

## Status

**Todo**

## Done

- [ ] Multi-location inventory database schema and transfer state machine implemented
- [ ] Barcode scanning and stocktaking workflows added to mobile app
- [ ] Automated low-stock reordering notification and purchase order generation built
- [ ] Network inventory valuation and turnover analytics reports deployed
