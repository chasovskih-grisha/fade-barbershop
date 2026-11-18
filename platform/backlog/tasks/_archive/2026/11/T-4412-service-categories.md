# T-4412 · Service Categories

- **Stage**: M3 (phase 8) · **Tags**: backend, frontend, catalog · **Complexity**: junior · **Depends on**: T-020
- **StoryPoints**: 5

## What

Service categories management: hierarchical or flat categorization of barber services (haircuts, beard trim, treatments, combos) with custom display order, icons/images, description, and visibility toggle. Admin UI for managing categories and assigning services. Public booking widget filtering by category.

## Why

As the service catalog grows, categorization is essential for clients to find services easily in the booking flow.

## Sources

- docs/products.md; T-020 (services catalog)

## Done

- [ ] Category entity and database migration
- [ ] Admin CRUD for categories
- [ ] Public booking filter by category
- [ ] Tests

## Risks

- [ ] **Orphan services**: deleting a category must require re-assigning or un-assigning services first
