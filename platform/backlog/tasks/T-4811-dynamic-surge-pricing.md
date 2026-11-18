# T-4811 · Real-Time Surge & Dynamic Pricing Engine

- **Stage**: M4 · **Tags**: backend, pricing, business · **Complexity**: senior · **Depends on**: T-024, T-040
- **StoryPoints**: 8

## What

Implement a dynamic pricing and surge rule engine allowing administrators to configure automated price multipliers based on time-of-day peak hours, day-of-week demand, and barber seniority tiers.

- Surge pricing rule builder in Admin panel (`T-024`).
- Real-time price calculation during slot selection and checkout breakdown (`PriceBreakdown`).
- Audit trail recording applied surge multipliers per appointment.

## Why

Maximize revenue during peak operating windows (Friday afternoons, weekends) while maintaining transparent pricing breakdowns for clients.

## Sources

- `platform/docs/roadmap.md`, `platform/backlog/tasks/T-024-catalog-prices.md`
- `platform/docs/composed-service-slot-optimization.md`

## Done

- [ ] Surge pricing rules domain model and database schema migration
- [ ] Admin UI rule configuration interface for time-based and occupancy-based multipliers
- [ ] Integration with availability and slot pricing calculation service
- [ ] Unit and integration tests verifying correct price computation under various scheduling conditions

## Risks

- [ ] **Price transparency**: Ensuring customers see clear price breakdowns before final appointment confirmation.
